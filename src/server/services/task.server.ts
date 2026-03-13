import prisma from '@/lib/prisma';
import { createTaskSchema, updateTaskSchema, createTimeLogSchema } from '@/lib/validations';
import { notifyTaskAssigned, notifyTaskStatusChanged, notifyTaskUpdated, notifyWatcherAdded } from '@/lib/notifications';
import { logCreate, logUpdate, logDelete } from '@/lib/audit-log';
import { getAccessibleProjectIds, getUserPermissions, canTransitionStatus } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';
import * as TaskPolicy from '@/server/policies/task.policy';
import { buildTaskFilters, TASK_LIST_INCLUDE } from '@/app/api/tasks/helpers';
import { updateParentTaskAggregates, resolveTaskId, updateSubtasksPathAndLevel } from '@/app/api/tasks/[id]/helpers';
import { z } from 'zod';

import { SessionUser } from '@/types';

import { buildPaginationResult, parsePaginationParams } from '@/lib/pagination';

export class TaskServerService {
    static async getTasks(user: SessionUser, searchParams: URLSearchParams) {
        const userId = user.id;

        // 1. Parse Query Parameters
        const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(searchParams);

        // 2. Determine Scope (Project Visibility)
        const allowedProjectIds = await getAccessibleProjectIds(userId, [
            PERMISSIONS.TASKS.VIEW_PROJECT,
            PERMISSIONS.TASKS.VIEW_ALL,
            PERMISSIONS.TASKS.VIEW_ASSIGNED
        ]);

        // If user explicitly requested a project, verify access
        const requestedProjectId = searchParams.get('projectId');
        if (requestedProjectId && !allowedProjectIds.includes(requestedProjectId)) {
            if (!user.isAdministrator) {
                throw new Error('Bạn không có quyền xem công việc trong dự án này');
            }
        }

        const effectiveProjectIds = requestedProjectId
            ? [requestedProjectId]
            : allowedProjectIds;

        if (effectiveProjectIds.length === 0 && !user.isAdministrator) {
            // In this early return case, total tasks are 0.
            const total = 0;
            return {
                tasks: [],
                pagination: buildPaginationResult(total, page, pageSize),
                aggregations: { totalHours: 0 }
            };
        }

        // 2.5 Map permissions per project for strict task visibility control
        const projectPermissionsMap: Record<string, string[]> = {};
        if (!user.isAdministrator && effectiveProjectIds.length > 0) {
            const memberships = await prisma.projectMember.findMany({
                where: {
                    userId,
                    projectId: { in: effectiveProjectIds }
                },
                include: { role: { include: { permissions: { include: { permission: true } } } } }
            });
            for (const m of memberships) {
                projectPermissionsMap[m.projectId] = m.role.permissions.map(rp => rp.permission.key);
            }
        }

        // 3. Build Filter Clause using helper
        const where = buildTaskFilters({
            projectIds: effectiveProjectIds,
            userId,
            isAdmin: user.isAdministrator,
            searchParams,
            projectPermissionsMap,
        });

        // 4. Execute Query & Aggregations
        const [tasks, total, taskAgg] = await Promise.all([
            prisma.task.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: TASK_LIST_INCLUDE,
            }),
            prisma.task.count({ where }),
            prisma.task.aggregate({
                _sum: { estimatedHours: true },
                where
            })
        ]);

        return {
            tasks,
            pagination: buildPaginationResult(total, page, pageSize),
            aggregations: {
                totalHours: taskAgg._sum.estimatedHours || 0
            }
        };
    }

    static async createTask(user: SessionUser, validatedData: z.infer<typeof createTaskSchema>) {
        // 1. Check Permission: 'tasks.create' (Add Issues)
        const permissions = await getUserPermissions(user.id, validatedData.projectId);
        const canCreate = TaskPolicy.canCreateTask(user, permissions);

        if (!canCreate) {
            throw new Error('Bạn không có quyền thêm công việc vào dự án này');
        }

        // 1.5. Validate Tracker (Project & Role restrictions)
        const projectTrackerCount = await prisma.projectTracker.count({
            where: { projectId: validatedData.projectId }
        });

        if (projectTrackerCount > 0) {
            const projectTracker = await prisma.projectTracker.findUnique({
                where: { projectId_trackerId: { projectId: validatedData.projectId, trackerId: validatedData.trackerId } }
            });
            if (!projectTracker) {
                throw new Error('Tracker này không được kích hoạt cho dự án hiện tại');
            }
        }

        if (!user.isAdministrator) {
            const member = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId: validatedData.projectId, userId: user.id }
                },
            });

            if (member) {
                const roleTracker = await prisma.roleTracker.findUnique({
                    where: {
                        roleId_trackerId: { roleId: member.roleId, trackerId: validatedData.trackerId }
                    }
                });
                if (!roleTracker) {
                    throw new Error('Tracker không được hỗ trợ trong dự án này');
                }
            }
        }

        // 1.6. Validate Assignee (Role restriction)
        if (!validatedData.assigneeId) {
            throw new Error('Người thực hiện không được để trống');
        }

        if (validatedData.assigneeId) {
            const assigneeMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId: validatedData.projectId, userId: validatedData.assigneeId }
                },
            });

            if (!assigneeMember) {
                throw new Error('Người thực hiện không phải là thành viên của dự án này');
            }

            if (validatedData.assigneeId !== user.id) {
                const canAssign = TaskPolicy.canAssignOthers(user, permissions);
                if (!canAssign) {
                    throw new Error('Bạn không có quyền giao việc cho người khác');
                }
            }
        }

        // 2. Validate Parent & Calculate Hierarchy
        let level = 0;
        let path: string | null = null;

        if (validatedData.parentId) {
            const parent = await prisma.task.findUnique({
                where: { id: validatedData.parentId },
                select: { id: true, projectId: true, level: true, path: true }
            });

            if (!parent) throw new Error('Không tìm thấy công việc cha');
            if (parent.projectId !== validatedData.projectId) {
                throw new Error('Công việc cha phải thuộc cùng một dự án');
            }
            if (parent.level >= 1) throw new Error('Không thể tạo công việc con của công việc con. Chỉ được phép 1 cấp subtask.');

            level = parent.level + 1;
            path = parent.path ? `${parent.path}.${parent.id}` : parent.id;
        }

        // 3. Create Task
        const task = await prisma.task.create({
            data: {
                ...validatedData,
                creatorId: user.id,
                level,
                path,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
                assigneeId: validatedData.assigneeId || null,
                parentId: validatedData.parentId || null,
                versionId: validatedData.versionId || null,
                estimatedHours: validatedData.estimatedHours ?? null,
                doneRatio: validatedData.doneRatio ?? 0,
                isPrivate: validatedData.isPrivate ?? false,
            },
            include: {
                project: { select: { id: true, name: true, identifier: true } },
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
            }
        });

        // 4. Post-Create Actions
        if (task.assigneeId && task.assigneeId !== user.id) {
            await notifyTaskAssigned(task.id, task.title, task.assigneeId, user.name || 'User');
        }

        await logCreate('task', task.id, user.id, {
            title: task.title,
            projectId: task.projectId
        });

        // 5. Update Aggregates
        if (task.parentId) {
            await updateParentTaskAggregates(task.parentId);
        }

        return task;
    }

    static async getTaskStatsByProject(projectId: string) {
        const statuses = await prisma.status.findMany({ orderBy: { position: 'asc' } });
        const taskStats = await prisma.task.groupBy({
            by: ['statusId'],
            where: { projectId },
            _count: { id: true },
        });

        return statuses.map((status) => ({
            status: status,
            count: taskStats.find((ts) => ts.statusId === status.id)?._count.id || 0,
        }));
    }

    static async getRecentTasksByProject(projectId: string, limit = 5) {
        return prisma.task.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' },
            take: limit,
            include: {
                status: { select: { id: true, name: true, isClosed: true } },
                priority: { select: { id: true, name: true, color: true } },
                assignee: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    /**
     * Lấy dữ liệu khởi tạo cho trang danh sách Tasks của 1 Project
     */
    static async getProjectTasksData(user: SessionUser, projectId: string, searchParams: URLSearchParams = new URLSearchParams()) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) return null;

        const member = await prisma.projectMember.findFirst({
            where: { projectId: projectId, userId: user.id }
        });

        if (!user.isAdministrator && !member && !project.isPublic) {
            return { accessDenied: true };
        }

        const [allTrackers, statuses, priorities, queries, projectData] = await Promise.all([
            prisma.tracker.findMany({ orderBy: { position: 'asc' } }),
            prisma.status.findMany({ orderBy: { position: 'asc' } }),
            prisma.priority.findMany({ orderBy: { position: 'asc' } }),
            prisma.query.findMany({
                where: {
                    OR: [
                        { isPublic: true, projectId: null },
                        { isPublic: true, projectId: projectId },
                        { userId: user.id, projectId: null },
                        { userId: user.id, projectId: projectId },
                    ],
                },
                include: {
                    user: { select: { id: true, name: true } },
                    project: { select: { id: true, name: true, identifier: true } },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.project.findUnique({
                where: { id: projectId },
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true } }
                        }
                    },
                    trackers: {
                        include: {
                            tracker: true
                        }
                    }
                }
            })
        ]);

        const users = projectData?.members.map(m => m.user) || [];

        let trackers = allTrackers;
        if (projectData && projectData.trackers.length > 0) {
            trackers = projectData.trackers.map(pt => pt.tracker).sort((a, b) => a.position - b.position);
        }

        const allowedTrackerIdsByProject: Record<string, string[]> = {};
        if (user.isAdministrator) {
            allowedTrackerIdsByProject[projectId] = projectData && projectData.trackers.length > 0
                ? projectData.trackers.map(pt => pt.trackerId)
                : allTrackers.map(t => t.id);
        } else if (member) {
            const roleTrackers = await prisma.roleTracker.findMany({ where: { roleId: member.roleId } });
            const roleAllowedIds = roleTrackers.map(rt => rt.trackerId);
            const projectEnabledIds = projectData?.trackers.map(pt => pt.trackerId) || [];
            const finalProjectIds = projectEnabledIds.length === 0 ? allTrackers.map(t => t.id) : projectEnabledIds;
            allowedTrackerIdsByProject[projectId] = finalProjectIds.filter((tid) => roleAllowedIds.includes(tid));
        } else {
            allowedTrackerIdsByProject[projectId] = [];
        }

        const projects = [{ id: project.id, name: project.name, identifier: project.identifier }];

        const projectPermissionsMap: Record<string, string[]> = {};
        if (!user.isAdministrator && member) {
            const memberships = await prisma.projectMember.findMany({
                where: { userId: user.id, projectId: projectId },
                include: { role: { include: { permissions: { include: { permission: true } } } } }
            });
            for (const m of memberships) {
                projectPermissionsMap[m.projectId] = m.role.permissions.map(rp => rp.permission.key);
            }
        }

        if (!searchParams.has('isClosed')) {
            searchParams.set('isClosed', 'false');
        }

        const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(searchParams);

        const where = buildTaskFilters({
            projectIds: [projectId],
            userId: user.id,
            isAdmin: user.isAdministrator,
            searchParams,
            projectPermissionsMap,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userMock = user as any;
        const projectPerms = projectPermissionsMap[projectId] || [];

        const canAssignOthers = TaskPolicy.canAssignOthers(userMock, projectPerms);
        const canCreateTask = TaskPolicy.canCreateTask(userMock, projectPerms);

        const [tasks, total, taskAgg] = await Promise.all([
            prisma.task.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    tracker: { select: { id: true, name: true } },
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, name: true, color: true } },
                    project: { select: { id: true, name: true, identifier: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                    parent: { select: { id: true, number: true, title: true } },
                    _count: { select: { subtasks: true, comments: true } },
                },
            }),
            prisma.task.count({ where }),
            prisma.task.aggregate({
                _sum: { estimatedHours: true },
                where
            })
        ]);

        const aggregations = {
            totalHours: taskAgg._sum.estimatedHours || 0
        };

        const pagination = buildPaginationResult(total, page, pageSize);

        return {
            tasks,
            pagination,
            aggregations,
            trackers,
            statuses,
            priorities,
            projects,
            queries,
            users,
            canAssignOthers,
            canCreateTask,
            projectPermissionsMap,
            allowedTrackerIdsByProject
        };
    }

    /**
     * Lấy dữ liệu chi tiết công việc
     */
    static async getTaskDetailData(user: SessionUser, taskId: string) {
        // Query database
        const isNumericId = /^\d+$/.test(taskId);
        const task = await prisma.task.findFirst({
            where: (isNumericId ? { number: parseInt(taskId) } : { id: taskId }),
            include: {
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true, isClosed: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        identifier: true,
                        members: {
                            where: {
                                user: { isAdministrator: false }, // Ẩn admin khỏi dropdown gán task
                            },
                            include: {
                                user: { select: { id: true, name: true, avatar: true } },
                                role: {
                                    include: {
                                        trackers: { select: { trackerId: true } }
                                    }
                                },
                            },
                        },
                        trackers: { select: { trackerId: true } },
                    },
                },
                version: { select: { id: true, name: true, status: true } },
                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                parent: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: { select: { name: true, isClosed: true } },
                    },
                },
                subtasks: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        startDate: true,
                        dueDate: true,
                        doneRatio: true,
                        status: { select: { id: true, name: true, isClosed: true } },
                        priority: { select: { id: true, name: true, color: true } },
                        tracker: { select: { id: true, name: true } },
                        assignee: { select: { id: true, name: true, avatar: true } },
                        timeLogs: { select: { hours: true } }, // Bottom-Up: cộng giờ thực tế lên task cha
                    },
                    orderBy: { createdAt: 'asc' },
                },
                watchers: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, email: true } },
                    },
                },
                attachments: {
                    include: {
                        user: { select: { id: true, name: true } }
                    }
                },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                timeLogs: {
                    include: {
                        user: { select: { id: true, name: true } },
                        activity: { select: { id: true, name: true } },
                    },
                    orderBy: { spentOn: 'desc' },
                },
            },
        });

        if (!task) {
            return { task: null };
        }

        // Check access level
        const isMember = task.project.members.some(m => m.user.id === user.id);
        if (!user.isAdministrator && !isMember) {
            return { accessDenied: true };
        }

        const member = task.project.members.find(m => m.user.id === user.id);
        const allTrackers = await prisma.tracker.findMany({ orderBy: { position: 'asc' } });
        let allowedTrackers = allTrackers;

        if (!user.isAdministrator) {
            const projectEnabledIds = task.project.trackers.map(t => t.trackerId);
            const projectAllowedIds = projectEnabledIds.length > 0 ? projectEnabledIds : allTrackers.map(t => t.id);
            let roleAllowedIds = allTrackers.map(t => t.id);

            if (member) {
                roleAllowedIds = member.role.trackers.map(t => t.trackerId);
            }

            const validIds = projectAllowedIds.filter((id) => roleAllowedIds.includes(id));
            allowedTrackers = allTrackers.filter(t => validIds.includes(t.id));
        } else {
            const projectEnabledIds = task.project.trackers.map(t => t.trackerId);
            if (projectEnabledIds.length > 0) {
                allowedTrackers = allTrackers.filter(t => projectEnabledIds.includes(t.id));
            }
        }

        const [statuses, priorities, versions] = await Promise.all([
            prisma.status.findMany({ orderBy: { position: 'asc' } }),
            prisma.priority.findMany({ orderBy: { position: 'asc' } }),
            prisma.version.findMany({ where: { projectId: task.projectId }, orderBy: { name: 'asc' } }),
        ]);

        let allowedStatuses: { id: string; name: string; isClosed: boolean }[] = statuses.map(s => ({
            id: s.id,
            name: s.name,
            isClosed: s.isClosed,
        }));

        if (!user.isAdministrator) {
            const membership = task.project.members.find(m => m.user.id === user.id);
            const transitions = await prisma.workflowTransition.findMany({
                where: {
                    trackerId: task.tracker.id,
                    fromStatusId: task.status.id,
                    OR: [{ roleId: null }, { roleId: membership?.role.id || null }],
                },
                include: { toStatus: { select: { id: true, name: true, isClosed: true } } },
            });
            allowedStatuses = [
                { id: task.status.id, name: task.status.name, isClosed: task.status.isClosed ?? false },
                ...transitions.map((t) => ({
                    id: t.toStatus.id,
                    name: t.toStatus.name,
                    isClosed: t.toStatus.isClosed,
                })),
            ].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userMock = user as any;
        const userPermissions = await getUserPermissions(user.id, task.projectId);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canEdit = TaskPolicy.canUpdateTask(userMock, task as any, userPermissions);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canFullEdit = TaskPolicy.canFullyEditTask(userMock, task as any, userPermissions);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canManageWatchers = TaskPolicy.canManageWatchers(userMock, task as any, userPermissions);
        const canAssignOthers = TaskPolicy.canAssignOthers(userMock, userPermissions);

        return {
            task,
            trackers: allowedTrackers,
            statuses,
            priorities,
            versions,
            allowedStatuses,
            canEdit,
            canFullEdit,
            canManageWatchers,
            canAssignOthers
        };
    }

    /**
     * Lấy dữ liệu khởi tạo cho trang danh sách Tasks trên toàn hệ thống
     */
    static async getGlobalTasksData(user: SessionUser, searchParams: URLSearchParams = new URLSearchParams()) {
        // 1. Get dictionary of all trackers
        const trackers = await prisma.tracker.findMany({ orderBy: { position: 'asc' } });

        // 2. Compute allowed trackers per project based on permissions
        const allowedTrackerIdsByProject: Record<string, string[]> = {};

        if (user.isAdministrator) {
            const allProjects = await prisma.project.findMany({
                where: { isArchived: false },
                include: { trackers: true },
            });
            allProjects.forEach((p) => {
                if (p.trackers.length === 0) {
                    allowedTrackerIdsByProject[p.id] = trackers.map(t => t.id);
                } else {
                    allowedTrackerIdsByProject[p.id] = p.trackers.map((t) => t.trackerId);
                }
            });
        } else {
            const memberships = await prisma.projectMember.findMany({
                where: {
                    userId: user.id,
                    project: { isArchived: false }
                },
                include: {
                    project: { include: { trackers: true } },
                    role: { include: { trackers: true } },
                },
            });

            memberships.forEach((m) => {
                const projectEnabledIds = m.project.trackers.map((t) => t.trackerId);
                const finalProjectIds = projectEnabledIds.length === 0
                    ? trackers.map(t => t.id)
                    : projectEnabledIds;

                const roleAllowedIds = m.role.trackers.map((t) => t.trackerId);

                const allowed = finalProjectIds.filter((id) => roleAllowedIds.includes(id));
                allowedTrackerIdsByProject[m.project.id] = allowed;
            });
        }

        // Get other filter data
        const [statuses, priorities, projects, queries, users] = await Promise.all([
            prisma.status.findMany({ orderBy: { position: 'asc' } }),
            prisma.priority.findMany({ orderBy: { position: 'asc' } }),
            user.isAdministrator
                ? prisma.project.findMany({
                    where: { isArchived: false },
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, identifier: true },
                })
                : prisma.project.findMany({
                    where: {
                        isArchived: false,
                        members: { some: { userId: user.id } },
                    },
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, identifier: true },
                }),
            prisma.query.findMany({
                where: {
                    OR: [
                        { isPublic: true },
                        { userId: user.id },
                    ],
                },
                include: {
                    user: { select: { id: true, name: true } },
                    project: { select: { id: true, name: true, identifier: true } },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.user.findMany({
                where: { isActive: true },
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            }),
        ]);

        // Prepare effective projects for task filtering
        const effectiveProjectIds = projects.map(p => p.id);
        const projectPermissionsMap: Record<string, string[]> = {};

        if (!user.isAdministrator && effectiveProjectIds.length > 0) {
            const fetchMemberships = await prisma.projectMember.findMany({
                where: {
                    userId: user.id,
                    projectId: { in: effectiveProjectIds }
                },
                include: { role: { include: { permissions: { include: { permission: true } } } } }
            });
            for (const m of fetchMemberships) {
                projectPermissionsMap[m.projectId] = m.role.permissions.map(rp => rp.permission.key);
            }
        }

        if (!searchParams.has('isClosed')) {
            searchParams.set('isClosed', 'false');
        }
        // Global tasks page default to 'my=true' for non-admin to show assigned/created tasks, exactly like old where clause did
        if (!user.isAdministrator && !searchParams.has('my')) {
            searchParams.set('my', 'true');
        }

        let canAssignOthers = user.isAdministrator || false;
        let canCreateTask = user.isAdministrator || false;

        if (!user.isAdministrator) {
            canAssignOthers = Object.values(projectPermissionsMap).some(perms => TaskPolicy.canAssignOthers(user as any, perms));
            canCreateTask = Object.values(projectPermissionsMap).some(perms => TaskPolicy.canCreateTask(user as any, perms));
        }

        const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(searchParams);

        // Initial tasks filter using robust helper
        const where = buildTaskFilters({
            projectIds: effectiveProjectIds,
            userId: user.id || '',
            isAdmin: user.isAdministrator || false,
            searchParams,
            projectPermissionsMap,
        });

        const [tasks, total, taskAgg] = await Promise.all([
            prisma.task.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    tracker: { select: { id: true, name: true } },
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, name: true, color: true } },
                    project: { select: { id: true, name: true, identifier: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                    parent: { select: { id: true, number: true, title: true } },
                    _count: { select: { subtasks: true, comments: true } },
                },
            }),
            prisma.task.count({ where }),
            prisma.task.aggregate({
                _sum: { estimatedHours: true },
                where
            })
        ]);

        const aggregations = {
            totalHours: taskAgg._sum.estimatedHours || 0
        };

        const pagination = buildPaginationResult(total, page, pageSize);

        return {
            tasks,
            pagination,
            aggregations,
            trackers,
            statuses,
            priorities,
            projects,
            queries,
            users,
            canAssignOthers,
            canCreateTask,
            projectPermissionsMap,
            allowedTrackerIdsByProject
        };
    }

    /**
     * Lấy chi tiết công việc cho REST API
     */
    static async getTask(user: SessionUser, rawId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Công việc không tồn tại');

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true, isClosed: true, defaultDoneRatio: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        identifier: true,
                    },
                },
                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                version: { select: { id: true, name: true, status: true, dueDate: true } },
                parent: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: { select: { name: true, isClosed: true } },
                    },
                },
                subtasks: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        doneRatio: true,
                        status: { select: { id: true, name: true, isClosed: true } },
                        priority: { select: { id: true, name: true, color: true } },
                        tracker: { select: { id: true, name: true } },
                        assignee: { select: { id: true, name: true, avatar: true } },
                        timeLogs: { select: { hours: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },

                comments: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                attachments: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                watchers: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
                timeLogs: {
                    include: {
                        activity: { select: { id: true, name: true } },
                        user: { select: { id: true, name: true } },
                    },
                    orderBy: { spentOn: 'desc' },
                },
            },
        });

        if (!task) {
            throw new Error('Công việc không tồn tại');
        }

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canView = TaskPolicy.canViewTask(user, task, userPermissions);

        if (!canView) {
            throw new Error('Không có quyền truy cập công việc này');
        }

        return task;
    }

    /**
     * Cập nhật chi tiết một công việc
     */
    static async updateTask(user: SessionUser, rawId: string, validatedData: z.infer<typeof updateTaskSchema>) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Công việc không tồn tại');

        const currentTask = await prisma.task.findUnique({
            where: { id },
            select: {
                id: true,
                statusId: true,
                trackerId: true,
                projectId: true,
                title: true,
                assigneeId: true,
                creatorId: true,
                description: true,
                priorityId: true,
                doneRatio: true,
                lockVersion: true,
                parentId: true,
                startDate: true,
                dueDate: true,
                estimatedHours: true,
                versionId: true,
                isPrivate: true,
                status: { select: { name: true } },
            },
        });

        if (!currentTask) {
            throw new Error('Công việc không tồn tại');
        }

        const userPermissions = await getUserPermissions(user.id, currentTask.projectId);
        const canEdit = TaskPolicy.canUpdateTask(user, currentTask, userPermissions);
        const canFullEdit = TaskPolicy.canFullyEditTask(user, currentTask, userPermissions);

        if (!canEdit) {
            throw new Error('Không có quyền chỉnh sửa công việc này');
        }

        if (!canFullEdit) {
            const restrictedFields = ['title', 'description', 'trackerId', 'priorityId',
                'assigneeId', 'versionId', 'estimatedHours', 'startDate', 'dueDate',
                'parentId', 'isPrivate'];
            const hasRestrictedField = restrictedFields.some(
                f => validatedData[f as keyof typeof validatedData] !== undefined
            );
            if (hasRestrictedField) {
                throw new Error('Bạn chỉ được cập nhật trạng thái và % hoàn thành của công việc được giao');
            }
        }

        if (validatedData.statusId && currentTask.statusId !== validatedData.statusId) {
            const canTransition = await canTransitionStatus(user, id, validatedData.statusId);
            if (!canTransition) {
                throw new Error('Không được phép chuyển sang trạng thái này theo quy trình làm việc (Workflow)');
            }
        }

        if (validatedData.lockVersion !== undefined && validatedData.lockVersion !== currentTask.lockVersion) {
            throw new Error('Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.-409'); // Hackish way to return 409
        }

        if (validatedData.trackerId && validatedData.trackerId !== currentTask.trackerId) {
            const projectTrackerCount = await prisma.projectTracker.count({
                where: { projectId: currentTask.projectId }
            });

            if (projectTrackerCount > 0) {
                const projectTracker = await prisma.projectTracker.findUnique({
                    where: { projectId_trackerId: { projectId: currentTask.projectId, trackerId: validatedData.trackerId } }
                });
                if (!projectTracker) {
                    throw new Error('Tracker này không được kích hoạt cho dự án này-400');
                }
            }

            if (!user.isAdministrator) {
                const member = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: { projectId: currentTask.projectId, userId: user.id }
                    },
                });
                if (member) {
                    const roleTracker = await prisma.roleTracker.findUnique({
                        where: {
                            roleId_trackerId: { roleId: member.roleId, trackerId: validatedData.trackerId }
                        }
                    });
                    if (!roleTracker) {
                        throw new Error('Vai trò của bạn không cho cho phép sử dụng Tracker này');
                    }
                }
            }
        }

        if (validatedData.assigneeId && validatedData.assigneeId !== currentTask.assigneeId) {
            const assigneeMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId: currentTask.projectId, userId: validatedData.assigneeId }
                },
            });

            if (!assigneeMember) {
                throw new Error('Người thực hiện không phải là thành viên của dự án này-400');
            }

            if (validatedData.assigneeId !== user.id) {
                const hasAssignPermission = TaskPolicy.canAssignOthers(user, userPermissions);
                if (!hasAssignPermission) {
                    throw new Error('Bạn không có quyền giao việc cho người khác');
                }
            }
        }

        const updateData: Record<string, unknown> = {
            lockVersion: { increment: 1 },
        };

        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.trackerId !== undefined) updateData.trackerId = validatedData.trackerId;
        if (validatedData.priorityId !== undefined) updateData.priorityId = validatedData.priorityId;
        if (validatedData.assigneeId !== undefined) updateData.assigneeId = validatedData.assigneeId || null;
        if (validatedData.versionId !== undefined) updateData.versionId = validatedData.versionId || null;
        if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours;
        if (validatedData.isPrivate !== undefined) updateData.isPrivate = validatedData.isPrivate;
        if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
        if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;

        if (validatedData.parentId !== undefined && validatedData.parentId !== currentTask.parentId) {
            if (validatedData.parentId === null) {
                updateData.parentId = null;
                updateData.level = 0;
                updateData.path = null;
            } else {
                const newParent = await prisma.task.findUnique({
                    where: { id: validatedData.parentId },
                    select: { id: true, projectId: true, level: true, path: true }
                });

                if (!newParent) {
                    throw new Error('Không tìm thấy công việc cha-400');
                }
                if (newParent.projectId !== currentTask.projectId) {
                    throw new Error('Công việc cha phải thuộc cùng một dự án-400');
                }
                if (newParent.level >= 1) {
                    throw new Error('Không thể tạo công việc con của công việc con. Chỉ được phép 1 cấp subtask.-400');
                }
                if (validatedData.parentId === id) {
                    throw new Error('Công việc không thể là công việc cha của chính nó-400');
                }

                updateData.parentId = validatedData.parentId;
                updateData.level = newParent.level + 1;
                updateData.path = newParent.path ? `${newParent.path}.${newParent.id}` : newParent.id;
            }
        }

        if (validatedData.doneRatio !== undefined) {
            updateData.doneRatio = validatedData.doneRatio;
        }

        const subtaskCount = await prisma.task.count({ where: { parentId: id } });
        const hasSubtasks = subtaskCount > 0;

        if (validatedData.statusId !== undefined) {
            updateData.statusId = validatedData.statusId;

            const newStatus = await prisma.status.findUnique({
                where: { id: validatedData.statusId },
                select: { isClosed: true, defaultDoneRatio: true },
            });

            const oldStatus = await prisma.status.findUnique({
                where: { id: currentTask.statusId },
                select: { isClosed: true },
            });

            if (newStatus) {
                if (hasSubtasks) {
                    if (newStatus.isClosed) {
                        updateData.doneRatio = 100;
                    }
                } else {
                    if (newStatus.isClosed) {
                        updateData.doneRatio = 100;
                    } else if (oldStatus?.isClosed && !newStatus.isClosed) {
                        updateData.doneRatio = newStatus.defaultDoneRatio ?? 0;
                    } else if (validatedData.doneRatio === undefined && newStatus.defaultDoneRatio !== null) {
                        updateData.doneRatio = newStatus.defaultDoneRatio;
                    }
                }
            }
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true, isClosed: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true, avatar: true } },
                version: { select: { id: true, name: true } },
            },
        });

        if (validatedData.parentId !== undefined && validatedData.parentId !== currentTask.parentId) {
            const newPath = updateData.path as string | null;
            const newLevel = updateData.level as number;
            await updateSubtasksPathAndLevel(id, newPath, newLevel);

            if (currentTask.parentId) {
                await updateParentTaskAggregates(currentTask.parentId);
            }
            if (task.parentId) {
                await updateParentTaskAggregates(task.parentId);
            }
        } else if (task.parentId) {
            await updateParentTaskAggregates(task.parentId);
        }

        if (hasSubtasks && validatedData.statusId && validatedData.statusId !== currentTask.statusId) {
            await updateParentTaskAggregates(id);
        }

        const actor = await prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true },
        });

        if (validatedData.assigneeId &&
            validatedData.assigneeId !== currentTask.assigneeId &&
            validatedData.assigneeId !== user.id) {
            notifyTaskAssigned(id, task.title, validatedData.assigneeId, actor?.name || 'Ai đó');
        }

        if (validatedData.statusId && validatedData.statusId !== currentTask.statusId) {
            notifyTaskStatusChanged(
                id,
                task.title,
                user.id,
                actor?.name || 'Ai đó',
                currentTask.status.name,
                task.status.name
            );
        }

        const assigneeChanged = validatedData.assigneeId && validatedData.assigneeId !== currentTask.assigneeId;
        const statusChanged = validatedData.statusId && validatedData.statusId !== currentTask.statusId;

        const otherFieldChanged =
            (validatedData.title !== undefined && validatedData.title !== currentTask.title) ||
            (validatedData.description !== undefined && validatedData.description !== currentTask.description) ||
            (validatedData.priorityId !== undefined && validatedData.priorityId !== currentTask.priorityId) ||
            (validatedData.trackerId !== undefined && validatedData.trackerId !== currentTask.trackerId) ||
            (validatedData.doneRatio !== undefined && validatedData.doneRatio !== currentTask.doneRatio) ||
            (validatedData.estimatedHours !== undefined && validatedData.estimatedHours !== currentTask.estimatedHours) ||
            (validatedData.startDate !== undefined) ||
            (validatedData.dueDate !== undefined) ||
            (validatedData.versionId !== undefined && validatedData.versionId !== currentTask.versionId) ||
            (validatedData.parentId !== undefined && validatedData.parentId !== currentTask.parentId);

        if (otherFieldChanged && !assigneeChanged && !statusChanged) {
            notifyTaskUpdated(id, task.title, user.id, actor?.name || 'Ai đó');
        }

        logUpdate('task', id, user.id,
            {
                title: currentTask.title,
                statusId: currentTask.statusId,
                assigneeId: currentTask.assigneeId,
                priorityId: currentTask.priorityId,
                trackerId: currentTask.trackerId,
                doneRatio: currentTask.doneRatio,
                estimatedHours: currentTask.estimatedHours,
                startDate: currentTask.startDate ? new Date(currentTask.startDate).toISOString().split('T')[0] : null,
                dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : null,
            },
            {
                title: task.title,
                statusId: task.status.id,
                assigneeId: task.assignee?.id,
                priorityId: task.priority.id,
                trackerId: task.tracker.id,
                doneRatio: task.doneRatio,
                estimatedHours: task.estimatedHours,
                startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : null,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
            }
        );

        return task;
    }

    /**
     * Xóa công việc
     */
    static async deleteTask(user: SessionUser, rawId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Công việc không tồn tại');

        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, creatorId: true, assigneeId: true, projectId: true, title: true, parentId: true, isPrivate: true },
        });

        if (!task) {
            throw new Error('Công việc không tồn tại');
        }

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canDelete = TaskPolicy.canDeleteTask(user, task, userPermissions);

        if (!canDelete) {
            throw new Error('Không có quyền xóa công việc này');
        }

        const descendants = await prisma.task.findMany({
            where: {
                OR: [
                    { path: id },
                    { path: { startsWith: `${id}.` } }
                ]
            },
            select: { id: true }
        });

        const allIdsToDelete = [id, ...descendants.map(d => d.id)];

        await prisma.$transaction(async (tx) => {
            await tx.timeLog.updateMany({
                where: { taskId: { in: allIdsToDelete } },
                data: { taskId: null }
            });

            await tx.task.deleteMany({
                where: { id: { in: allIdsToDelete } }
            });
        });

        logDelete('task', id, user.id, { title: task.title, projectId: task.projectId });

        if (task.parentId) {
            await updateParentTaskAggregates(task.parentId);
        }

        return true;
    }

    /**
     * Lấy danh sách time logs của một task
     */
    static async getTimeLogs(user: SessionUser, rawId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Không tìm thấy công việc-404');

        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true }
        });

        if (!task) throw new Error('Không tìm thấy công việc-404');

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canView = TaskPolicy.canViewTask(user, task as any, userPermissions);

        if (!canView) throw new Error('Không có quyền xem công việc này-403');

        const canViewAll = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) || user.isAdministrator;
        const canViewOwn = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN);

        if (!canViewAll && !canViewOwn) {
            throw new Error('Không có quyền xem nhật ký thời gian-403');
        }

        const timeLogs = await prisma.timeLog.findMany({
            where: {
                taskId: id,
                ...(canViewAll ? {} : { userId: user.id })
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
            },
            orderBy: { spentOn: 'desc' },
        });

        return timeLogs;
    }

    /**
     * Log thời gian cho một task
     */
    static async createTimeLog(user: SessionUser, rawId: string, validatedData: z.infer<typeof createTimeLogSchema>) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Không tìm thấy công việc-404');

        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true },
        });

        if (!task) throw new Error('Không tìm thấy công việc-404');

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canView = TaskPolicy.canViewTask(user, task as any, userPermissions);
        if (!canView) throw new Error('Không có quyền truy cập công việc này-403');

        const canLogTime = userPermissions.includes(PERMISSIONS.TIMELOGS.LOG_TIME) || user.isAdministrator;
        if (!canLogTime) throw new Error('Bạn không có quyền ghi nhận thời gian-403');

        const taskFull = await prisma.task.findUnique({
            where: { id },
            select: { parentId: true },
        });

        const timeLog = await prisma.timeLog.create({
            data: {
                hours: validatedData.hours,
                spentOn: new Date(validatedData.spentOn),
                comments: validatedData.comments,
                activityId: validatedData.activityId,
                taskId: id,
                projectId: task.projectId,
                userId: user.id,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
            },
        });

        if (taskFull?.parentId) {
            await updateParentTaskAggregates(taskFull.parentId);
        }

        return timeLog;
    }

    /**
     * Copy công việc sang dự án khác hoặc nhân bản
     */
    static async copyTask(user: SessionUser, rawId: string, options: { targetProjectId?: string, copySubtasks?: boolean, copyWatchers?: boolean, title?: string, description?: string, trackerId?: string, statusId?: string, priorityId?: string, assigneeId?: string, versionId?: string, estimatedHours?: number, doneRatio?: number, startDate?: Date, dueDate?: Date, isPrivate?: boolean }) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Không tìm thấy công việc-404');
        const { targetProjectId, copySubtasks, copyWatchers } = options;

        const originalTask = await prisma.task.findUnique({
            where: { id },
            include: { subtasks: true, watchers: true, attachments: true },
        });

        if (!originalTask) {
            throw new Error('Không tìm thấy công việc-404');
        }

        const sourcePermissions = await getUserPermissions(user.id, originalTask.projectId);
        if (!TaskPolicy.canViewTask(user, originalTask as any, sourcePermissions)) {
            throw new Error('Không có quyền xem công việc gốc-403');
        }

        const projectId = targetProjectId || originalTask.projectId;
        const targetPermissions = await getUserPermissions(user.id, projectId);
        const canCreate = TaskPolicy.canCreateTask(user, targetPermissions);

        if (!canCreate) {
            throw new Error('Bạn không có quyền tạo công việc trong dự án đích-403');
        }

        const defaultStatus = await prisma.status.findFirst({ where: { isDefault: true } });
        if (!defaultStatus) throw new Error('Hệ thống chưa cấu hình trạng thái mặc định-500');

        const copiedTask = await prisma.task.create({
            data: {
                title: options.title || `${originalTask.title} (Copy)`,
                description: options.description !== undefined ? options.description : originalTask.description,
                trackerId: options.trackerId || originalTask.trackerId,
                statusId: options.statusId || defaultStatus.id,
                priorityId: options.priorityId || originalTask.priorityId,
                assigneeId: options.assigneeId || null,
                versionId: options.versionId || null,
                projectId,
                creatorId: user.id,
                estimatedHours: options.estimatedHours !== undefined ? options.estimatedHours : originalTask.estimatedHours,
                doneRatio: options.doneRatio !== undefined ? options.doneRatio : 0,
                startDate: options.startDate !== undefined ? options.startDate : originalTask.startDate,
                dueDate: options.dueDate !== undefined ? options.dueDate : originalTask.dueDate,
                isPrivate: options.isPrivate !== undefined ? options.isPrivate : originalTask.isPrivate,
            },
        });

        if (copyWatchers && originalTask.watchers.length > 0) {
            await prisma.watcher.createMany({
                data: originalTask.watchers.map(w => ({ taskId: copiedTask.id, userId: w.userId })),
                skipDuplicates: true,
            });
        }

        if (copySubtasks && originalTask.subtasks.length > 0) {
            for (const subtask of originalTask.subtasks) {
                await prisma.task.create({
                    data: {
                        title: subtask.title,
                        description: subtask.description,
                        trackerId: subtask.trackerId,
                        statusId: defaultStatus.id,
                        priorityId: subtask.priorityId,
                        projectId,
                        creatorId: user.id,
                        parentId: copiedTask.id,
                        estimatedHours: subtask.estimatedHours,
                        doneRatio: 0,
                        level: subtask.level,
                    },
                });
            }
        }

        const result = await prisma.task.findUnique({
            where: { id: copiedTask.id },
            include: {
                tracker: true,
                status: true,
                priority: true,
                project: { select: { id: true, name: true } },
                _count: { select: { subtasks: true } },
            },
        });

        return result;
    }

    /**
     * Bật/tắt theo dõi task cho chính mình
     */
    static async toggleWatch(user: SessionUser, rawId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Task không tồn tại-404');

        const existing = await prisma.watcher.findFirst({
            where: { taskId: id, userId: user.id },
        });

        if (existing) {
            await prisma.watcher.delete({ where: { id: existing.id } });
            return { watching: false, message: 'Đã hủy theo dõi' };
        } else {
            const task = await prisma.task.findUnique({
                where: { id },
                select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true }
            });
            if (!task) throw new Error('Task không tồn tại-404');
            const userPermissions = await getUserPermissions(user.id, task.projectId);
            const canView = TaskPolicy.canViewTask(user, task as any, userPermissions);
            if (!canView) throw new Error('Không có quyền truy cập task này-403');

            await prisma.watcher.create({
                data: { taskId: id, userId: user.id },
            });
            return { watching: true, message: 'Đã theo dõi' };
        }
    }

    /**
     * Lấy danh sách watchers
     */
    static async getWatchers(user: SessionUser, rawId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Task không tồn tại-404');

        const watchers = await prisma.watcher.findMany({
            where: { taskId: id },
            include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });

        const isWatching = watchers.some((w) => w.userId === user.id);

        return { watchers, isWatching, count: watchers.length };
    }

    /**
     * Thêm watcher
     */
    static async addWatcher(user: SessionUser, rawId: string, targetUserId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Task không tồn tại-404');

        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, projectId: true, creatorId: true, assigneeId: true, isPrivate: true, title: true },
        });
        if (!task) throw new Error('Task không tồn tại-404');

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canView = TaskPolicy.canViewTask(user, task as any, userPermissions);
        if (!canView) throw new Error('Không có quyền truy cập công việc này-403');

        const isSelfWatch = targetUserId === user.id;
        const canManage = TaskPolicy.canManageWatchers(user, task as any, userPermissions);
        if (!isSelfWatch && !canManage) throw new Error('Không có quyền thêm người theo dõi cho công việc này-403');

        const isMember = await prisma.projectMember.findFirst({
            where: { userId: targetUserId, projectId: task.projectId },
        });
        if (!isMember && !user.isAdministrator) throw new Error('Người dùng này không phải thành viên dự án-400');

        try {
            const watcher = await prisma.watcher.create({
                data: { taskId: id, userId: targetUserId },
                include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
            });

            if (!isSelfWatch) {
                notifyWatcherAdded(id, task.title, targetUserId, user.name || 'Ai đó').catch(e => {
                    console.error('Failed to send watcher added notification:', e);
                });
            }

            return watcher;
        } catch (error: any) {
            if (error.code === 'P2002') throw new Error('Người dùng này đang theo dõi task rồi-409');
            throw error;
        }
    }

    /**
     * Xóa watcher
     */
    static async removeWatcher(user: SessionUser, rawId: string, targetUserId: string) {
        const id = await resolveTaskId(rawId);
        if (!id) throw new Error('Công việc không tồn tại-404');

        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, projectId: true, creatorId: true, assigneeId: true, isPrivate: true },
        });
        if (!task) throw new Error('Công việc không tồn tại-404');

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canView = TaskPolicy.canViewTask(user, task as any, userPermissions);
        if (!canView) throw new Error('Không có quyền truy cập công việc này-403');

        const isSelfUnwatch = targetUserId === user.id;
        const canManage = TaskPolicy.canManageWatchers(user, task as any, userPermissions);
        if (!isSelfUnwatch && !canManage) throw new Error('Không có quyền xóa người theo dõi-403');

        const watcher = await prisma.watcher.findFirst({
            where: { taskId: id, userId: targetUserId },
        });
        if (!watcher) throw new Error('Người dùng này không theo dõi task-404');

        await prisma.watcher.delete({ where: { id: watcher.id } });
        return { message: 'Đã xóa khỏi danh sách theo dõi' };
    }
}
