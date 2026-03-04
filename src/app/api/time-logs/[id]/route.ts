import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-error';
import { getUserPermissions } from '@/lib/permissions';
import * as TimeLogPolicy from '@/modules/timelog/timelog.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';


export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const timeLog = await prisma.timeLog.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            activity: { select: { id: true, name: true } },
            task: { select: { id: true, number: true, title: true } },
            project: { select: { id: true, name: true, identifier: true } },
        },
    });

    if (!timeLog) {
        return errorResponse('Không tìm thấy bản ghi thời gian', 404);
    }

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, timeLog.projectId);
    const canView = TimeLogPolicy.canViewTimeLog(user, timeLog, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền xem bản ghi này', 403);
    }

    return successResponse(timeLog);

});

export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    const { hours, spentOn, activityId, comments } = body;

    // 1. Load resource first for Policy check
    const existingLog = await prisma.timeLog.findUnique({
        where: { id },
        select: { id: true, userId: true, projectId: true },
    });

    if (!existingLog) {
        return errorResponse('Không tìm thấy bản ghi thời gian', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, existingLog.projectId);
    const canUpdate = TimeLogPolicy.canUpdateTimeLog(user, existingLog, userPermissions);

    if (!canUpdate) {
        return errorResponse('Không có quyền chỉnh sửa bản ghi thời gian này', 403);
    }


    const updateData: any = {};
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (spentOn) updateData.spentOn = new Date(spentOn);
    if (activityId) updateData.activityId = activityId;
    if (comments !== undefined) updateData.comments = comments || null;

    const timeLog = await prisma.timeLog.update({
        where: { id },
        data: updateData,
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            activity: { select: { id: true, name: true } },
            task: { select: { id: true, number: true, title: true } },
            project: { select: { id: true, name: true, identifier: true } },
        },
    });

    return successResponse(timeLog);
});

export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Load resource for Policy check
    const existingLog = await prisma.timeLog.findUnique({
        where: { id },
        select: { id: true, userId: true, projectId: true },
    });

    if (!existingLog) {
        return errorResponse('Không tìm thấy bản ghi thời gian', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, existingLog.projectId);
    const canDelete = TimeLogPolicy.canDeleteTimeLog(user, existingLog, userPermissions);

    if (!canDelete) {
        return errorResponse('Không có quyền xóa bản ghi thời gian này', 403);
    }


    await prisma.timeLog.delete({ where: { id } });

    return successResponse({ message: 'Đã xóa bản ghi thời gian' });
});
