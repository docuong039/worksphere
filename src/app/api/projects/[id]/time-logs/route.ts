import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-error';
import { createTimeLogSchema } from '@/lib/validations';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';


export const GET = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền xem dự án này', 403);
    }


    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const activityId = searchParams.get('activityId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const where: any = { projectId: id };
    if (userId) where.userId = userId;
    if (activityId) where.activityId = activityId;
    if (fromDate || toDate) {
        where.spentOn = {};
        if (fromDate) where.spentOn.gte = new Date(fromDate);
        if (toDate) where.spentOn.lte = new Date(toDate);
    }

    const timeLogs = await prisma.timeLog.findMany({
        where,
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            activity: { select: { id: true, name: true } },
            task: { select: { id: true, number: true, title: true } },
        },
        orderBy: { spentOn: 'desc' },
    });

    return successResponse(timeLogs);
});

export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    const validatedData = createTimeLogSchema.parse(body);

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập dự án này', 403);
    }

    // Check permission to log time (RBAC part)
    const canLogTime = userPermissions.includes(PERMISSIONS.TIMELOGS.LOG_TIME) || user.isAdministrator;

    if (!canLogTime) {
        return errorResponse('Bạn không có quyền ghi nhận thời gian cho dự án này', 403);
    }


    const timeLog = await prisma.timeLog.create({
        data: {
            hours: validatedData.hours,
            spentOn: new Date(validatedData.spentOn),
            comments: validatedData.comments,
            activityId: validatedData.activityId,
            taskId: validatedData.taskId || null,
            projectId: id,
            userId: user.id,
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            activity: { select: { id: true, name: true } },
            task: { select: { id: true, number: true, title: true } },
        },
    });

    return successResponse(timeLog);
});
