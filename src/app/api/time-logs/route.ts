import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';
import * as ProjectPolicy from '@/modules/project/project.policy';


// GET /api/time-logs - Get raw time logs list
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 1. Authorization Policy context
    const userPermissions = await getUserPermissions(user.id, projectId || '');

    const canViewAll = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) || user.isAdministrator;
    const canViewOwn = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN) || user.isAdministrator;

    if (!canViewAll && !canViewOwn) {
        return errorResponse('Không có quyền xem nhật ký thời gian', 403);
    }



    // Where clause
    const where: any = {};

    // Date filter
    if (startDate || endDate) {
        where.spentOn = {};
        if (startDate) where.spentOn.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.spentOn.lte = end;
        }
    }

    // Project filter
    if (projectId) {
        where.projectId = projectId;
    } else if (!user.isAdministrator && !canViewAll) {
        where.project = { members: { some: { userId: user.id } } };
    }

    // User filter: can only filter by another user if admin or has view_all
    if (userId) {
        if (!user.isAdministrator && !canViewAll && userId !== user.id) {
            // Can only see own logs
            where.userId = user.id;
        } else {
            where.userId = userId;
        }
    } else if (!user.isAdministrator && !canViewAll) {

        // Restrict to own logs if no view_all permission
        where.userId = user.id;
    }

    const timeLogs = await prisma.timeLog.findMany({
        where,
        include: {
            project: { select: { name: true } },
            task: { select: { title: true, number: true } },
            user: { select: { name: true, email: true } },
            activity: { select: { name: true } },
        },
        orderBy: { spentOn: 'desc' },
        take: 1000, // Limit for safety
    });

    return successResponse({ timeLogs });
});
