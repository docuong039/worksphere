import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-error';
import { getUserPermissions } from '@/lib/permissions';
import * as TimeLogPolicy from '@/modules/timelog/timelog.policy';
import { withAuth } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';


export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const activityId = searchParams.get('activityId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    // 1. Authorization Policy context
    const userPermissions = await getUserPermissions(user.id, projectId || '');

    const canViewAll = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) || user.isAdministrator;
    const canViewOwn = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN) || user.isAdministrator;

    if (!canViewAll && !canViewOwn) {
        return errorResponse('Không có quyền xem nhật ký thời gian', 403);
    }

    // Build where clause
    const where: any = {};

    if (projectId) {
        where.projectId = projectId;
    }

    if (activityId) {
        where.activityId = activityId;
    }

    if (fromDate || toDate) {
        where.spentOn = {};
        if (fromDate) where.spentOn.gte = new Date(fromDate);
        if (toDate) where.spentOn.lte = new Date(toDate + 'T23:59:59');
    }

    // Permission-based user filter
    if (!canViewAll) {
        // Can only view own logs
        where.userId = user.id;
    } else if (userId) {
        where.userId = userId;
    }

    const [timeLogs, total, totalHoursResult] = await Promise.all([
        prisma.timeLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
            orderBy: [{ spentOn: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.timeLog.count({ where }),
        prisma.timeLog.aggregate({
            where,
            _sum: { hours: true },
        }),
    ]);

    return successResponse({
        timeLogs,
        totalHours: totalHoursResult._sum.hours || 0,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});

export const POST = withAuth(async (req, user) => {
    const body = await req.json();
    const { hours, spentOn, activityId, comments, taskId, projectId } = body;

    if (!hours || hours <= 0) {
        return errorResponse('Số giờ phải lớn hơn 0', 400);
    }

    if (!spentOn) {
        return errorResponse('Ngày thực hiện không được để trống', 400);
    }

    if (!activityId) {
        return errorResponse('Hoạt động không được để trống', 400);
    }

    if (!projectId) {
        return errorResponse('Dự án không được để trống', 400);
    }

    // 1. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, projectId);
    const canLog = TimeLogPolicy.canLogTime(user, userPermissions);

    if (!canLog) {
        return errorResponse('Bạn không có quyền ghi nhận thời gian cho dự án này', 403);
    }


    const timeLog = await prisma.timeLog.create({
        data: {
            hours: parseFloat(hours),
            spentOn: new Date(spentOn),
            comments: comments || null,
            activityId,
            taskId: taskId || null,
            projectId,
            userId: user.id,
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            activity: { select: { id: true, name: true } },
            task: { select: { id: true, number: true, title: true } },
            project: { select: { id: true, name: true, identifier: true } },
        },
    });

    return successResponse(timeLog);
});

