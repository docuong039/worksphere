import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const activityId = searchParams.get('activityId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');

        const isAdmin = session.user.isAdministrator;
        const canViewAll = await hasPermission(session.user, 'timelogs.view_all');
        const canViewOwn = await hasPermission(session.user, 'timelogs.view_own');

        if (!isAdmin && !canViewAll && !canViewOwn) {
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
        if (!isAdmin && !canViewAll) {
            // Can only view own logs
            where.userId = session.user.id;
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
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

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

        // Check project membership
        const isMember = await prisma.projectMember.findFirst({
            where: { userId: session.user.id, projectId },
        });

        if (!session.user.isAdministrator && !isMember) {
            return errorResponse('Bạn không phải là thành viên của dự án này', 403);
        }

        // Check permission to log time
        const canLogTime = await hasPermission(session.user, 'timelogs.log_time', projectId);
        if (!session.user.isAdministrator && !canLogTime) {
            return errorResponse('Bạn không có quyền ghi nhận thời gian', 403);
        }

        const timeLog = await prisma.timeLog.create({
            data: {
                hours: parseFloat(hours),
                spentOn: new Date(spentOn),
                comments: comments || null,
                activityId,
                taskId: taskId || null,
                projectId,
                userId: session.user.id,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        return successResponse(timeLog);
    } catch (error) {
        return handleApiError(error);
    }
}
