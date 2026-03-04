import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { createTaskSchema } from '@/lib/validations';
import { notifyTaskAssigned } from '@/lib/notifications';
import { logCreate } from '@/lib/audit-log';
import { getAccessibleProjectIds } from '@/lib/permissions';
import { withAuth } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';

// Import helpers
import { buildTaskFilters, TASK_LIST_INCLUDE, parsePaginationParams } from './helpers';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';


// ==========================================
// GET /api/tasks
// List tasks with strict permission filtering
// ==========================================
export const GET = withAuth(async (req, user) => {
    const userId = user.id;

    // 1. Parse Query Parameters
    const { searchParams } = new URL(req.url);
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
            return errorResponse('Bạn không có quyền xem công việc trong dự án này', 403);
        }
    }

    const effectiveProjectIds = requestedProjectId
        ? [requestedProjectId]
        : allowedProjectIds;

    if (effectiveProjectIds.length === 0 && !user.isAdministrator) {
        return successResponse({ tasks: [], pagination: { page, pageSize, total: 0, totalPages: 0 } });
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

    return successResponse({
        tasks,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
        aggregations: {
            totalHours: taskAgg._sum.estimatedHours || 0
        }
    });
});

// ==========================================
// POST /api/tasks
// Create new task with permission check
// ==========================================
export const POST = withAuth(async (req, user) => {
    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    // 1. Check Permission: 'tasks.create' (Add Issues)
    const permissions = await getUserPermissions(user.id, validatedData.projectId);
    const canCreate = TaskPolicy.canCreateTask(user, permissions);

    if (!canCreate) {
        return errorResponse('Bạn không có quyền thêm công việc vào dự án này', 403);
    }



    // 1.5. Validate Tracker (Project & Role restrictions)
    // Check if tracker is enabled for project
    const projectTrackerCount = await prisma.projectTracker.count({
        where: { projectId: validatedData.projectId }
    });

    if (projectTrackerCount > 0) {
        const projectTracker = await prisma.projectTracker.findUnique({
            where: { projectId_trackerId: { projectId: validatedData.projectId, trackerId: validatedData.trackerId } }
        });
        if (!projectTracker) {
            return errorResponse('Tracker này không được kích hoạt cho dự án hiện tại', 400);
        }
    }

    // Check if tracker is allowed for user's role
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
        if (validatedData.assigneeId !== user.id) {
            const canAssign = TaskPolicy.canAssignOthers(user, permissions);
            if (!canAssign) {
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
            creatorId: user.id,
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
    if (task.assigneeId && task.assigneeId !== user.id) {
        await notifyTaskAssigned(task.id, task.title, task.assigneeId, user.name || 'User');
    }

    await logCreate('task', task.id, user.id, {
        title: task.title,
        projectId: task.projectId
    });

    return successResponse(task, 201);
});
