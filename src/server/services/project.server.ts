import prisma from '@/lib/prisma';
import { createProjectSchema } from '@/lib/validations';
import { logCreate, logUpdate, logDelete } from '@/lib/audit-log';
import { notifyProjectCreated } from '@/lib/notifications';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';
import { buildProjectFilters, PROJECT_LIST_INCLUDE } from '@/app/api/projects/helpers';
import { deleteProjectData, PROJECT_DETAIL_INCLUDE } from '@/app/api/projects/[id]/helpers';
import { updateProjectSchema, createVersionSchema, updateVersionSchema } from '@/lib/validations';
import { z } from 'zod';

import { SessionUser } from '@/types';
import { parsePaginationParams, buildPaginationResult } from '@/lib/pagination';

export class ProjectServerService {
    /**
     * Lấy danh sách dự án
     */
    static async getProjects(user: SessionUser, searchParams: URLSearchParams) {
        const { page, pageSize } = parsePaginationParams(searchParams, 'updatedAt');
        
        const search = searchParams.get('search') || undefined;
        const status = searchParams.get('status');
        const myProjects = searchParams.get('my') === 'true';

        // Build filter using helper
        const where = buildProjectFilters({
            search,
            status,
            myProjects,
            userId: user.id,
            isAdmin: user.isAdministrator,
        });

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                include: PROJECT_LIST_INCLUDE,
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.project.count({ where }),
        ]);

        // Đếm closedTasks cho tất cả projects trong 1 query duy nhất (thay vì kéo full task array)
        const projectIds = projects.map(p => p.id);
        const closedTaskCounts = projectIds.length > 0
            ? await prisma.task.groupBy({
                by: ['projectId'],
                where: {
                    projectId: { in: projectIds },
                    status: { isClosed: true },
                },
                _count: { id: true },
            })
            : [];

        const closedTaskMap = new Map(closedTaskCounts.map(c => [c.projectId, c._count.id]));

        const projectsWithProgress = projects.map(p => ({
            ...p,
            closedTaskCount: closedTaskMap.get(p.id) || 0,
        }));

        return {
            projects: projectsWithProgress,
            pagination: buildPaginationResult(total, page, pageSize),
        };
    }

    /**
     * Kiểm tra quyền truy cập dự án
     */
    static async checkAccess(user: SessionUser, projectId: string): Promise<boolean> {
        if (user.isAdministrator) return true;
        const member = await prisma.projectMember.findFirst({
            where: { userId: user.id, projectId: projectId },
        });
        return !!member;
    }

    /**
     * Lấy thông tin chi tiết của 1 dự án
     */
    static async getProjectDetails(projectId: string) {
        return prisma.project.findUnique({
            where: { id: projectId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                        role: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: { tasks: true, members: true },
                },
            },
        });
    }

    /**
     * Tạo một dự án mới
     */
    static async createProject(user: SessionUser, payload: z.infer<typeof createProjectSchema>) {
        // Verify user exists in DB (fix for P2003 error if DB was reset)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true }
        });

        if (!dbUser) {
            console.error(`Session user ID ${user.id} not found in Database users table.`);
            throw new Error('Tài khoản không tồn tại trong hệ thống (vui lòng đăng xuất và đăng nhập lại)');
        }

        // 1. Check Permission: 'projects.create'
        const globalPermissions = await getUserPermissions(user.id, ''); // No project ID for global creation check
        const canCreate = ProjectPolicy.canCreateProject(user, globalPermissions);

        if (!canCreate) {
            throw new Error('Bạn không có quyền tạo dự án');
        }

        // Kiểm tra identifier unique
        const existing = await prisma.project.findUnique({
            where: { identifier: payload.identifier },
        });

        if (existing) {
            throw new Error('Định danh dự án đã tồn tại');
        }

        // 1. Get default Manager role
        // Ưu tiên tìm role 'Manager' hoặc 'Project Manager' hoặc lấy role đầu tiên có quyền quản lý
        let managerRole = await prisma.role.findFirst({
            where: { name: { in: ['Manager', 'Project Manager', 'Quản lý'] } },
        });

        // Fallback: Lấy role đầu tiên nếu không có manager (để tránh lỗi không tạo được member)
        if (!managerRole) {
            console.warn('Warning: No "Manager" role found. Looking for any role.');
            managerRole = await prisma.role.findFirst();
        }

        if (!managerRole) {
            throw new Error('Hệ thống chưa cấu hình Role nào. Vui lòng liên hệ Admin.');
        }

        const allTrackers = await prisma.tracker.findMany({ select: { id: true } });

        // Sử dụng Transaction để đảm bảo tính toàn vẹn
        const project = await prisma.$transaction(async (tx) => {
            // 2. Create Project & Member
            const newProject = await tx.project.create({
                data: {
                    name: payload.name,
                    description: payload.description,
                    identifier: payload.identifier,
                    startDate: payload.startDate ? new Date(payload.startDate) : undefined,
                    endDate: payload.endDate ? new Date(payload.endDate) : undefined,
                    creatorId: user.id,
                    members: {
                        create: {
                            userId: user.id,
                            roleId: managerRole!.id, // Chắc chắn tồn tại
                        },
                    },
                },
                include: PROJECT_LIST_INCLUDE,
            });

            // 3. Enable all trackers
            if (allTrackers.length > 0) {
                await tx.projectTracker.createMany({
                    data: allTrackers.map((t) => ({
                        projectId: newProject.id,
                        trackerId: t.id,
                    })),
                });
            }

            return newProject;
        });

        // Ghi nhật ký hoạt động (ngoài transaction để không block)
        logCreate('project', project.id, user.id, {
            name: project.name,
            identifier: payload.identifier,
        });

        // Gửi thông báo cho admins (fire-and-forget)
        notifyProjectCreated(project.id, project.name, user.id, user.name || 'Ai đó');

        return project;
    }

    /**
     * Lấy chi tiết dự án kèm thông kê (Cho REST API)
     */
    static async getProjectWithStats(user: SessionUser, projectId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: PROJECT_DETAIL_INCLUDE,
        });

        if (!project) {
            throw new Error('Dự án không tồn tại');
        }

        // Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canView = ProjectPolicy.canViewProject(user, userPermissions);

        if (!canView) {
            throw new Error('Không có quyền truy cập dự án này');
        }

        // Thêm thống kê tasks
        const taskStats = await prisma.task.groupBy({
            by: ['statusId'],
            where: { projectId },
            _count: { id: true },
        });

        const statuses = await prisma.status.findMany();
        const tasksByStatus = statuses.map((status) => ({
            status,
            count: taskStats.find((ts) => ts.statusId === status.id)?._count.id || 0,
        }));

        return {
            ...project,
            tasksByStatus,
        };
    }

    /**
     * Cập nhật dự án
     */
    static async updateProject(user: SessionUser, projectId: string, payload: z.infer<typeof updateProjectSchema>) {
        // 1. Load resource first for Policy Check
        const currentProject = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, description: true, identifier: true, isArchived: true, creatorId: true },
        });

        if (!currentProject) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canUpdate = ProjectPolicy.canUpdateProject(user, currentProject, userPermissions);

        if (!canUpdate) {
            throw new Error('Không có quyền sửa dự án này');
        }

        // Nếu đổi identifier, kiểm tra unique
        if (payload.identifier) {
            const existing = await prisma.project.findFirst({
                where: {
                    identifier: payload.identifier,
                    id: { not: projectId },
                },
            });

            if (existing) {
                throw new Error('Định danh dự án đã tồn tại');
            }
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...payload,
                startDate: payload.startDate ? new Date(payload.startDate) : undefined,
                endDate: payload.endDate ? new Date(payload.endDate) : undefined,
            },
            include: {
                creator: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { tasks: true, members: true },
                },
            },
        });

        // Ghi nhật ký hoạt động
        if (currentProject) {
            await logUpdate('project', projectId, user.id,
                { name: currentProject.name, description: currentProject.description, isArchived: currentProject.isArchived },
                { name: project.name, description: project.description, isArchived: project.isArchived }
            );
        }

        return project;
    }

    /**
     * Xóa dự án
     */
    static async deleteProject(user: SessionUser, projectId: string) {
        // 1. Load resource for Policy check
        const projectToDelete = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, identifier: true, creatorId: true, isArchived: true },
        });

        if (!projectToDelete) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canDelete = ProjectPolicy.canDeleteProject(user, projectToDelete, userPermissions);

        if (!canDelete) {
            throw new Error('Không có quyền xóa dự án này');
        }

        // Use helper to delete all related data transactionally
        await deleteProjectData(projectId);

        // Ghi nhật ký hoạt động
        await logDelete('project', projectId, user.id, {
            name: projectToDelete.name,
            identifier: projectToDelete.identifier,
        });

        return true;
    }

    /**
     * Lấy danh sách Activity của Dự Án
     */
    static async getActivityLogs(projectId: string) {
        const projectTasks = await prisma.task.findMany({
            where: { projectId: projectId },
            select: { id: true, number: true, title: true, tracker: { select: { name: true } } }
        });

        const taskIds = projectTasks.map(t => t.id);
        const taskMap = new Map(projectTasks.map(t => [t.id, t]));

        const since = new Date();
        since.setDate(since.getDate() - 30);

        const [auditLogs, comments] = await Promise.all([
            prisma.auditLog.findMany({
                where: {
                    OR: [
                        { entityType: 'project', entityId: projectId },
                        { entityType: 'task', entityId: { in: taskIds } }
                    ],
                    createdAt: { gt: since }
                },
                include: {
                    user: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            }),
            prisma.comment.findMany({
                where: { task: { projectId: projectId }, createdAt: { gt: since } },
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    task: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            tracker: { select: { name: true } },
                            status: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);

        return {
            auditLogs,
            comments,
            taskMap,
        };
    }

    /**
     * Lấy danh sách thành viên dự án và những user có thể được thêm
     */
    static async getMembersAndAvailableUsers(projectId: string) {
        // Query Roles, Users và Project Members, ẩn admin
        const [project, roles, availableUsers] = await Promise.all([
            prisma.project.findUnique({
                where: { id: projectId },
                include: {
                    members: {
                        where: {
                            user: { isAdministrator: false }, // Ẩn admin
                        },
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, avatar: true, isActive: true },
                            },
                            role: {
                                select: { id: true, name: true },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            prisma.role.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
            prisma.user.findMany({
                where: {
                    isActive: true,
                    isAdministrator: false, // Không thêm admin
                    projectMemberships: {
                        none: { projectId: projectId }
                    }
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, email: true, avatar: true },
            }),
        ]);

        return {
            project,
            roles,
            availableUsers
        };
    }

    /**
     * Lấy danh sách thành viên (cho REST API)
     */
    static async getProjectMembers(user: SessionUser, rawProjectId: string, assignableOnly: boolean) {
        // 1. Resolve Project ID (supports UUID or Identifier)
        const project = await prisma.project.findFirst({
            where: {
                OR: [
                    { id: rawProjectId },
                    { identifier: rawProjectId }
                ]
            },
            select: { id: true }
        });

        if (!project) {
            return []; // Return empty list safely
        }

        const projectId = project.id;

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canView = ProjectPolicy.canViewProject(user, userPermissions);

        if (!canView) {
            throw new Error('Không có quyền truy cập thông tin thành viên dự án này');
        }

        // Check if user has permission to assign tasks to others (RBAC part of logic)
        let limitToSelf = false;
        if (assignableOnly && !user.isAdministrator) {
            // "tasks.assign_others" can be put here
            const hasAssignPermission = userPermissions.includes('tasks.assign_others');
            if (!hasAssignPermission) {
                limitToSelf = true;
            }
        }

        const members = await prisma.projectMember.findMany({
            where: {
                projectId,
                ...(limitToSelf ? { userId: user.id } : {}),
                ...(assignableOnly ? { role: { assignable: true } } : {}),
                // Không hiển thị Administrator trong danh sách
                user: { isAdministrator: false },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        isActive: true,
                    },
                },
                role: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return members;
    }

    /**
     * Thêm thành viên vào dự án
     */
    static async addProjectMembers(user: SessionUser, rawProjectId: string, body: { userId?: string, userIds?: string[], roleId: string }) {
        const { userId, userIds, roleId } = body;

        if ((!userId && (!userIds || userIds.length === 0)) || !roleId) {
            throw new Error('Cần chọn người dùng và vai trò');
        }

        const idsToAdd: string[] = userIds || (userId ? [userId] : []);

        // 1. Resolve Project ID and Load resource
        const project = await prisma.project.findUnique({
            where: { id: rawProjectId },
            select: { id: true, name: true, creatorId: true, isArchived: true }
        });

        if (!project) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, project.id);
        const canManage = ProjectPolicy.canManageMembers(user, project, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền quản lý thành viên cho dự án này');
        }

        // Prevent non-admins from adding administrators to projects
        if (!user.isAdministrator) {
            const adminCount = await prisma.user.count({
                where: {
                    id: { in: idsToAdd },
                    isAdministrator: true
                }
            });
            if (adminCount > 0) {
                throw new Error('Không thể thêm người quản trị hệ thống vào dự án');
            }
        }

        // Check if role exists
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
            throw new Error('Vai trò không tồn tại');
        }

        // Find existing members to exclude
        const existingMembers = await prisma.projectMember.findMany({
            where: {
                projectId: project.id,
                userId: { in: idsToAdd }
            },
            select: { userId: true }
        });

        const existingUserIds = existingMembers.map(m => m.userId);
        const finalIdsToAdd = idsToAdd.filter(uid => !existingUserIds.includes(uid));

        if (finalIdsToAdd.length === 0) {
            throw new Error('Tất cả người dùng được chọn đã là thành viên');
        }

        // Add members
        const result = await prisma.projectMember.createMany({
            data: finalIdsToAdd.map(uid => ({
                projectId: project.id,
                userId: uid,
                roleId: roleId
            }))
        });

        // Notify added members (async, fire-and-forget)
        import('@/lib/notifications').then((mod) => {
            const actorName = user.name || 'Ai đó';
            for (const uid of finalIdsToAdd) {
                if (uid !== user.id) {
                    mod.notifyProjectMemberAdded(project.id, project.name, uid, actorName);
                }
            }
        });

        return { count: result.count };
    }

    /**
     * Kiểm tra quyền quản lý member của dự án
     */
    static async canManageMembers(user: SessionUser, projectId: string) {
        if (user.isAdministrator) return true;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId: user.id },
                    include: { role: true }
                }
            }
        });

        if (!project) return false;

        const myMemberStatus = project.members[0];
        if (!myMemberStatus) return false;

        return project.creatorId === user.id || myMemberStatus.role.name === 'Manager';
    }

    /**
     * Cập nhật vai trò (role) của thành viên trong dự án
     */
    static async updateProjectMemberRole(user: SessionUser, rawProjectId: string, memberId: string, roleId: string) {
        if (!roleId) {
            throw new Error('roleId là bắt buộc');
        }

        // 1. Load project for Policy check
        const project = await prisma.project.findUnique({
            where: { id: rawProjectId },
            select: { id: true, creatorId: true, isArchived: true }
        });

        if (!project) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, project.id);
        const canManage = ProjectPolicy.canManageMembers(user, project, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền quản lý thành viên cho dự án này');
        }

        // Check if role exists
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
            throw new Error('Vai trò không tồn tại');
        }

        // Check if target member is an administrator
        const memberToUpdate = await prisma.projectMember.findUnique({
            where: { id: memberId },
            include: { user: { select: { isAdministrator: true } } }
        });

        if (!memberToUpdate) {
            throw new Error('Thành viên không tồn tại');
        }

        if (!user.isAdministrator && memberToUpdate.user.isAdministrator) {
            throw new Error('Không thể cập nhật nhân sự là Quản trị viên');
        }

        // Update member role
        const member = await prisma.projectMember.update({
            where: { id: memberId },
            data: { roleId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                role: {
                    select: { id: true, name: true },
                },
            },
        });

        return member;
    }

    /**
     * Xóa thành viên khỏi dự án
     */
    static async removeProjectMember(user: SessionUser, rawProjectId: string, memberId: string) {
        // 1. Load project for Policy check
        const project = await prisma.project.findUnique({
            where: { id: rawProjectId },
            select: { id: true, name: true, creatorId: true, isArchived: true },
        });

        if (!project) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, project.id);
        const canManage = ProjectPolicy.canManageMembers(user, project, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền quản lý thành viên cho dự án này');
        }

        // Get member info
        const member = await prisma.projectMember.findUnique({
            where: { id: memberId },
            include: {
                user: { select: { id: true, isAdministrator: true } },
            },
        });

        if (!member) {
            throw new Error('Thành viên không tồn tại');
        }

        if (!user.isAdministrator && member.user.isAdministrator) {
            throw new Error('Không thể xóa Quản trị viên khỏi dự án');
        }

        // Check if member is project creator
        if (!user.isAdministrator && project.creatorId === member.user.id) {
            throw new Error('Không thể xóa người tạo dự án khỏi danh sách thành viên');
        }

        // Check if member has assigned tasks
        const assignedTasksCount = await prisma.task.count({
            where: {
                projectId: project.id,
                assigneeId: member.user.id,
            },
        });

        if (assignedTasksCount > 0) {
            throw new Error(`Không thể xóa thành viên đang được gán ${assignedTasksCount} công việc. Vui lòng reassign trước.`);
        }

        // Delete member
        await prisma.projectMember.delete({
            where: { id: memberId },
        });

        // Notify removed member (async, fire-and-forget, skip if user removing themselves)
        if (member.user.id !== user.id) {
            import('@/lib/notifications').then(mod => {
                mod.notifyProjectMemberRemoved(project.id, project.name, member.user.id, user.name || 'Ai đó');
            });
        }

        return true;
    }

    /**
     * Lưu trữ hoặc Mở lưu trữ Dự án (Archive/Unarchive)
     */
    static async toggleArchiveProject(user: SessionUser, projectId: string) {
        // 1. Kiểm tra tồn tại
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { creatorId: true, isArchived: true },
        });

        if (!project) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Kiểm tra quyền
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canArchive = ProjectPolicy.canArchiveProject(user, project as any, userPermissions);

        if (!canArchive) {
            throw new Error('Bạn không có quyền lưu trữ/khôi phục dự án này');
        }

        // 3. Thực thi đổi trạng thái (Toggle)
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { isArchived: !project.isArchived },
            select: { id: true, name: true, isArchived: true },
        });

        return updatedProject;
    }

    /**
     * Lấy danh sách Tracker (Loại nhiệm vụ) đang kích hoạt trong Dự án
     */
    static async getProjectTrackers(user: SessionUser, projectId: string) {
        // 1. Kiểm tra quyền Xem dự án (ProjectPolicy)
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canView = ProjectPolicy.canViewProject(user, userPermissions);

        if (!canView) {
            throw new Error('Không có quyền truy cập thông tin này');
        }

        const projectTrackers = await prisma.projectTracker.findMany({
            where: { projectId: projectId },
            include: {
                tracker: {
                    select: { id: true, name: true, description: true, position: true, isDefault: true },
                },
            },
            orderBy: { tracker: { position: 'asc' } },
        });

        // Behavior: Nếu dự án chưa cài đặt gì, thì trả ra toàn bộ hệ thống mặc định
        if (projectTrackers.length === 0) {
            return prisma.tracker.findMany({
                orderBy: { position: 'asc' },
                select: { id: true, name: true, description: true, position: true, isDefault: true },
            });
        }

        return projectTrackers.map((pt) => pt.tracker);
    }

    /**
     * Cập nhật danh sách Tracker cho Dự án
     */
    static async updateProjectTrackers(user: SessionUser, projectId: string, trackerIds: any) {
        if (!Array.isArray(trackerIds)) {
            throw new Error('Danh sách ID tracker phải là một mảng');
        }

        // 1. Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new Error('Dự án không tồn tại');
        }

        // 2. Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canManage = ProjectPolicy.canManageTrackers(user, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền chỉnh sửa loại công việc của dự án này');
        }

        // Transaction: delete existing and create new
        await prisma.$transaction(async (tx) => {
            await tx.projectTracker.deleteMany({
                where: { projectId: projectId },
            });

            if (trackerIds.length > 0) {
                await tx.projectTracker.createMany({
                    data: trackerIds.map((trackerId: string) => ({
                        projectId: projectId,
                        trackerId,
                    })),
                    skipDuplicates: true,
                });
            }
        });

        // return updated trackers
        const updated = await prisma.projectTracker.findMany({
            where: { projectId: projectId },
            include: { tracker: true },
        });

        return updated.map(pt => pt.tracker);
    }

    /**
     * Lấy danh sách Version (Phiên bản phát hành) của Dự án
     */
    static async getProjectVersions(user: SessionUser, projectId: string) {
        // 1. Kiểm tra Quyền (ProjectPolicy)
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canView = ProjectPolicy.canViewProject(user, userPermissions);

        if (!canView) {
            throw new Error('Không có quyền truy cập dự án này');
        }

        const versions = await prisma.version.findMany({
            where: { projectId },
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        const versionsWithProgress = await Promise.all(
            versions.map(async (version) => {
                const taskStats = await prisma.task.groupBy({
                    by: ['statusId'],
                    where: { versionId: version.id },
                    _count: true,
                });

                const closedStatuses = await prisma.status.findMany({
                    where: { isClosed: true },
                    select: { id: true },
                });
                const closedStatusIds = closedStatuses.map((s) => s.id);

                const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
                const closedTasks = taskStats
                    .filter((s) => closedStatusIds.includes(s.statusId))
                    .reduce((sum, s) => sum + s._count, 0);

                return {
                    ...version,
                    totalTasks,
                    closedTasks,
                    progress: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                };
            })
        );

        return versionsWithProgress;
    }

    /**
     * Thêm mới Version cho Dự án
     */
    static async createProjectVersion(user: SessionUser, projectId: string, payload: z.infer<typeof createVersionSchema>) {
        // 1. Kiểm tra QA
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canManage = ProjectPolicy.canManageVersions(user, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền tạo version');
        }

        const version = await prisma.version.create({
            data: {
                name: payload.name,
                description: payload.description,
                status: payload.status ?? 'open',
                dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
                projectId,
            },
        });

        return version;
    }

    /**
     * Lấy dữ liệu Lộ trình (Roadmap) của dự án
     */
    static async getProjectRoadmap(projectId: string) {
        const [versions, backlogTasks, backlogCount] = await Promise.all([
            prisma.version.findMany({
                where: { projectId: projectId },
                include: {
                    tasks: {
                        include: {
                            status: { select: { id: true, name: true, isClosed: true } },
                            priority: { select: { id: true, name: true, color: true } },
                            tracker: { select: { id: true, name: true } },
                            assignee: { select: { id: true, name: true, avatar: true } },
                        },
                        orderBy: [{ priority: { position: 'asc' } }, { createdAt: 'asc' }],
                    },
                },
                orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
            }),
            prisma.task.findMany({
                where: { projectId: projectId, versionId: null },
                include: {
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, name: true, color: true } },
                    tracker: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.task.count({
                where: { projectId: projectId, versionId: null },
            })
        ]);

        const roadmapVersions = versions.map((version) => {
            const totalTasks = version.tasks.length;
            const closedTasks = version.tasks.filter((t) => t.status.isClosed).length;
            const avgDoneRatio =
                totalTasks > 0
                    ? Math.round(version.tasks.reduce((sum, t) => sum + t.doneRatio, 0) / totalTasks)
                    : 0;

            return {
                ...version,
                dueDate: version.dueDate ? version.dueDate.toISOString() : null,
                progress: {
                    total: totalTasks,
                    closed: closedTasks,
                    open: totalTasks - closedTasks,
                    doneRatio: avgDoneRatio,
                    percentage: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                },
                tasksByStatus: {},
            };
        });

        return {
            roadmapVersions,
            backlogTasks,
            backlogCount
        };
    }

    /**
     * Lấy dữ liệu trang Cài đặt (Settings) của dự án
     */
    static async getSettingsData(user: SessionUser, projectId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                trackers: {
                    select: { trackerId: true },
                },
            },
        });

        if (!project) return null;

        const permissions = await getUserPermissions(user.id, projectId);
        // FIXME: Check literal logic based on your old settings
        const PERMISSIONS_PROJECT_EDIT = 'projects.edit';
        const canManage = user.isAdministrator || permissions.includes(PERMISSIONS_PROJECT_EDIT);

        const allTrackers = await prisma.tracker.findMany({
            orderBy: { position: 'asc' },
        });

        const enabledTrackerIds = project.trackers.map(t => t.trackerId);

        return {
            project,
            canManage,
            allTrackers,
            enabledTrackerIds
        };
    }

    /**
     * Lấy dữ liệu trang Versions (Phiên bản) của dự án
     */
    static async getProjectVersionsData(user: SessionUser, projectId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                name: true,
                identifier: true,
            },
        });

        if (!project) return null;

        const versions = await prisma.version.findMany({
            where: { projectId: projectId },
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
            include: {
                _count: { select: { tasks: true } },
            },
        });

        const versionsWithProgress = await Promise.all(
            versions.map(async (version) => {
                const tasks = await prisma.task.findMany({
                    where: { versionId: version.id },
                    select: {
                        status: { select: { isClosed: true } },
                    },
                });

                const totalTasks = tasks.length;
                const closedTasks = tasks.filter((t) => t.status.isClosed).length;
                const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

                return {
                    ...version,
                    totalTasks,
                    closedTasks,
                    progress,
                };
            })
        );

        const canManage =
            user.isAdministrator ||
            !!(await prisma.projectMember.findFirst({
                where: {
                    userId: user.id,
                    projectId: projectId,
                    role: {
                        permissions: {
                            some: {
                                permission: { key: 'projects.manage_versions' },
                            },
                        },
                    },
                },
            }));

        return {
            project,
            versionsWithProgress,
            canManage
        };
    }

    /**
     * Tra cứu một version cụ thể
     */
    static async getVersionById(user: SessionUser, versionId: string) {
        const version = await prisma.version.findUnique({
            where: { id: versionId },
            include: {
                project: { select: { id: true, name: true, identifier: true } },
                tasks: {
                    include: {
                        status: { select: { id: true, name: true, isClosed: true } },
                        priority: { select: { id: true, name: true, color: true } },
                        assignee: { select: { id: true, name: true, avatar: true } },
                        tracker: { select: { id: true, name: true } },
                    },
                    orderBy: [{ status: { position: 'asc' } }, { priority: { position: 'desc' } }],
                },
            },
        });

        if (!version) {
            throw new Error('Phiên bản không tồn tại-404');
        }

        const userPermissions = await getUserPermissions(user.id, version.projectId);
        const canView = ProjectPolicy.canViewProject(user, userPermissions);

        if (!canView) {
            throw new Error('Không có quyền truy cập phiên bản này-403');
        }

        const closedTasks = version.tasks.filter((t) => t.status.isClosed).length;
        const totalTasks = version.tasks.length;
        const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

        return {
            ...version,
            closedTasks,
            totalTasks,
            progress,
        };
    }

    /**
     * Cập nhật thông tin version
     */
    static async updateVersion(user: SessionUser, versionId: string, payload: z.infer<typeof updateVersionSchema>) {
        const existingVersion = await prisma.version.findUnique({
            where: { id: versionId },
            select: { id: true, projectId: true },
        });

        if (!existingVersion) {
            throw new Error('Phiên bản không tồn tại-404');
        }

        const userPermissions = await getUserPermissions(user.id, existingVersion.projectId);
        const canManage = ProjectPolicy.canManageVersions(user, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền chỉnh sửa phiên bản này-403');
        }

        const version = await prisma.version.update({
            where: { id: versionId },
            data: {
                ...payload,
                dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
            },
        });

        return version;
    }

    /**
     * Xóa version
     */
    static async deleteVersion(user: SessionUser, versionId: string) {
        const existingVersion = await prisma.version.findUnique({
            where: { id: versionId },
            select: { id: true, projectId: true, _count: { select: { tasks: true } } },
        });

        if (!existingVersion) {
            throw new Error('Phiên bản không tồn tại-404');
        }

        const userPermissions = await getUserPermissions(user.id, existingVersion.projectId);
        const canManage = ProjectPolicy.canManageVersions(user, userPermissions);

        if (!canManage) {
            throw new Error('Không có quyền xóa phiên bản này-403');
        }

        if (existingVersion._count.tasks > 0) {
            await prisma.task.updateMany({
                where: { versionId: versionId },
                data: { versionId: null },
            });
        }

        await prisma.version.delete({
            where: { id: versionId },
        });

        return { message: 'Đã xóa version' };
    }
}
