import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createTaskSchema } from '@/lib/validations';
import { notifyTaskAssigned } from '@/lib/notifications';
import { logCreate } from '@/lib/audit-log';
import { checkProjectPermission, getAccessibleProjectIds } from '@/lib/permissions';
import { updateParentAttributes } from '@/lib/services/task-service';
import { Prisma } from '@prisma/client';

// ==========================================
// GET /api/tasks
// List tasks with strict permission filtering
// ==========================================
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return errorResponse('Chưa đăng nhập', 401);
        const userId = session.user.id;

        // 1. Parse Query Parameters
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '50')));
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        // 2. Determine Scope (Project Visibility)
        // Get all project IDs where user has 'tasks.view_project' (View Issues)
        const allowedProjectIds = await getAccessibleProjectIds(userId, 'tasks.view_project');

        // If user explicitly requested a project, verify access
        const requestedProjectId = searchParams.get('projectId');
        if (requestedProjectId && !allowedProjectIds.includes(requestedProjectId)) {
            // If not in allowed list, check if user is admin (getAccessibleProjectIds handles admin, but double check)
            if (!session.user.isAdministrator) {
                return errorResponse('Bạn không có quyền xem công việc trong dự án này', 403);
            }
        }

        const effectiveProjectIds = requestedProjectId
            ? [requestedProjectId]
            : allowedProjectIds;

        if (effectiveProjectIds.length === 0 && !session.user.isAdministrator) {
            return successResponse({ tasks: [], pagination: { page, pageSize, total: 0, totalPages: 0 } });
        }


        // 3. Build Filter Clause
        const where: Prisma.TaskWhereInput = {
            projectId: { in: effectiveProjectIds }
        };

        // Security: Filter private tasks - non-admins can only see their own private tasks
        if (!session.user.isAdministrator) {
            where.OR = [
                { isPrivate: false },
                { isPrivate: true, creatorId: userId },
                { isPrivate: true, assigneeId: userId },
            ];
        }

        // Standard Filters
        if (searchParams.get('statusId')) where.statusId = searchParams.get('statusId')!;
        if (searchParams.get('priorityId')) where.priorityId = searchParams.get('priorityId')!;
        if (searchParams.get('trackerId')) where.trackerId = searchParams.get('trackerId')!;
        if (searchParams.get('assigneeId')) where.assigneeId = searchParams.get('assigneeId')!;
        if (searchParams.get('creatorId')) where.creatorId = searchParams.get('creatorId')!;

        // Version Filter
        const versionId = searchParams.get('versionId');
        if (versionId === 'null') where.versionId = null;
        else if (versionId) where.versionId = versionId;

        // Parent Filter
        const parentId = searchParams.get('parentId');
        if (parentId === 'null') where.parentId = null;
        else if (parentId) where.parentId = parentId;

        // Closed Status Filter
        const isClosed = searchParams.get('isClosed');
        if (isClosed === 'true') where.status = { isClosed: true };
        else if (isClosed === 'false') where.status = { isClosed: false };

        // "My Tasks" Quick Filters - use AND to combine with existing OR
        if (searchParams.get('my') === 'true') {
            where.AND = { OR: [{ assigneeId: userId }, { creatorId: userId }] };
        } else if (searchParams.get('assignedToMe') === 'true') {
            where.assigneeId = userId;
        } else if (searchParams.get('createdByMe') === 'true') {
            where.creatorId = userId;
        }

        // Text Search
        const search = searchParams.get('search');
        if (search) {
            const searchCondition = {
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                ]
            };
            // Combine with existing AND if present
            if (where.AND) {
                where.AND = [where.AND as Prisma.TaskWhereInput, searchCondition];
            } else {
                where.AND = searchCondition;
            }
        }

        // 4. Execute Query
        const [tasks, total] = await Promise.all([
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
                    creator: { select: { id: true, name: true } },
                    version: { select: { id: true, name: true, status: true } },
                    subtasks: {
                        include: {
                            status: { select: { id: true, name: true, isClosed: true } },
                            assignee: { select: { id: true, name: true, avatar: true } },
                        },
                        orderBy: { updatedAt: 'desc' }
                    },
                    attachments: {
                        include: {
                            user: { select: { id: true, name: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    _count: { select: { subtasks: true, comments: true } },
                },
            }),
            prisma.task.count({ where }),
        ]);

        return successResponse({
            tasks,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });

    } catch (error) {
        return handleApiError(error);
    }
}

// ==========================================
// POST /api/tasks
// Create new task with permission check
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return errorResponse('Chưa đăng nhập', 401);

        const body = await req.json();
        const validatedData = createTaskSchema.parse(body);

        // 1. Check Permission: 'tasks.create' (Add Issues)
        const hasPermission = await checkProjectPermission(
            session.user as any,
            'tasks.create',
            validatedData.projectId
        );

        if (!hasPermission) {
            return errorResponse('Bạn không có quyền thêm công việc vào dự án này', 403);
        }

        // 1.5. Validate Tracker (Project & Role restrictions)
        // Check if tracker is enabled for project
        const projectTracker = await prisma.projectTracker.findUnique({
            where: { projectId_trackerId: { projectId: validatedData.projectId, trackerId: validatedData.trackerId } }
        });
        if (!projectTracker) {
            return errorResponse('Tracker này không được kích hoạt cho dự án hiện tại', 400);
        }

        // Check if tracker is allowed for user's role
        if (!session.user.isAdministrator) {
            const member = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId: validatedData.projectId, userId: session.user.id }
                },
            });

            if (member) {
                const roleTracker = await prisma.roleTracker.findUnique({
                    where: {
                        roleId_trackerId: { roleId: member.roleId, trackerId: validatedData.trackerId }
                    }
                });
                if (!roleTracker) {
                    return errorResponse('Tracker không được hỗ trợ trong dự án này', 400);
                }
            }
        }

        // 1.6. Validate Assignee (Role restriction)
        if (validatedData.assigneeId) {
            const assigneeMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId: validatedData.projectId, userId: validatedData.assigneeId }
                },
            });

            if (!assigneeMember) {
                return errorResponse('Người thực hiện không phải là thành viên của dự án này', 400);
            }

            // Check if requester can assign to others
            if (validatedData.assigneeId !== session.user.id && !session.user.isAdministrator) {
                const requesterMember = await prisma.projectMember.findUnique({
                    where: { projectId_userId: { projectId: validatedData.projectId, userId: session.user.id } },
                    include: { role: true }
                });

                // STRICT CHECK: explicit true required.
                // Cast to any to avoid TS error if schema not synced in IDE
                const RoleWithPerm = requesterMember?.role as any;
                if (!requesterMember || RoleWithPerm?.canAssignToOther !== true) {
                    return errorResponse('Bạn không có quyền giao việc cho người khác', 403);
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

            if (!parent) return errorResponse('Không tìm thấy công việc cha', 400);
            if (parent.projectId !== validatedData.projectId) {
                return errorResponse('Công việc cha phải thuộc cùng một dự án', 400);
            }
            if (parent.level >= 4) return errorResponse('Vượt quá độ sâu tối đa của công việc con (tối đa 5 cấp)', 400);

            level = parent.level + 1;
            path = parent.path ? `${parent.path}.${parent.id}` : parent.id;
        }

        // 3. Create Task
        const task = await prisma.task.create({
            data: {
                ...validatedData,
                creatorId: session.user.id,
                level,
                path,
                // Default values if not provided
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

        // 4. Post-Create Actions (Notifications & Logging)
        // Note: In a real system, use a queue or ensure these don't block response if they fail
        if (task.assigneeId && task.assigneeId !== session.user.id) {
            await notifyTaskAssigned(task.id, task.title, task.assigneeId, session.user.name || 'User');
        }

        await logCreate('task', task.id, session.user.id, {
            title: task.title,
            projectId: task.projectId
        });

        // 5. Trigger Roll-up Calculation
        if (task.parentId) {
            await updateParentAttributes(task.parentId);
        }

        return successResponse(task, 201);

    } catch (error) {
        return handleApiError(error);
    }
}
