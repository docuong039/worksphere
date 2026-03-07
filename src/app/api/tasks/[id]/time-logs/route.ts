import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-error';
import { createTimeLogSchema } from '@/lib/validations';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';
import { updateParentTaskAggregates } from '@/app/api/tasks/[id]/helpers';


export const dynamic = 'force-dynamic';

// Helper: Resolve Task ID (CUID or Number)
async function resolveTaskId(idStr: string) {
    if (/^\d+$/.test(idStr)) {
        const task = await prisma.task.findUnique({
            where: { number: parseInt(idStr) },
            select: { id: true }
        });

        return task?.id || null;
    }
    return idStr;
}

export const GET = withAuth(async (_req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;
    const id = await resolveTaskId(rawId);

    if (!id) {
        return errorResponse('Không tìm thấy công việc', 404);
    }

    // Load task for Policy and metadata
    const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true }
    });

    if (!task) {
        return errorResponse('Không tìm thấy công việc', 404);
    }

    // Authorization Policy
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canView = TaskPolicy.canViewTask(user, task, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền xem công việc này', 403);
    }

    // Check view permissions for time logs (RBAC)
    const canViewAll = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) || user.isAdministrator;
    const canViewOwn = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
        return errorResponse('Không có quyền xem nhật ký thời gian', 403);
    }


    const timeLogs = await prisma.timeLog.findMany({
        where: {
            taskId: id,
            ...(canViewAll ? {} : { userId: user.id }) // If only canViewOwn, filter by current user
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            activity: { select: { id: true, name: true } },
        },
        orderBy: { spentOn: 'desc' },
    });

    return successResponse(timeLogs);
});

export const POST = withAuth(async (req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;
    const id = await resolveTaskId(rawId);

    if (!id) {
        return errorResponse('Không tìm thấy công việc', 404);
    }

    const body = await req.json();
    const validatedData = createTimeLogSchema.parse(body);

    // Load task for Policy and metadata
    const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true },
    });

    if (!task) {
        return errorResponse('Không tìm thấy công việc', 404);
    }

    // Authorization Policy
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canView = TaskPolicy.canViewTask(user, task, userPermissions);
    if (!canView) {
        return errorResponse('Không có quyền truy cập công việc này', 403);
    }

    // Check permission to log time (RBAC)
    const canLogTime = userPermissions.includes(PERMISSIONS.TIMELOGS.LOG_TIME) || user.isAdministrator;
    if (!canLogTime) {
        return errorResponse('Bạn không có quyền ghi nhận thời gian', 403);
    }


    // Load task để có parentId (cần cho Bottom-Up)
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

    // Trigger tính lại Task Cha nếu task này là Subtask (Bottom-Up)
    if (taskFull?.parentId) {
        await updateParentTaskAggregates(taskFull.parentId);
    }

    return successResponse(timeLog);
});
