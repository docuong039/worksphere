import prisma from '@/lib/prisma';
import { errorResponse } from '@/lib/api-error';
import { getUserPermissions } from '@/lib/permissions';
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

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, projectId || undefined);

    const canViewAll = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) || user.isAdministrator;
    const canViewOwn = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN) || user.isAdministrator;

    if (!canViewAll && !canViewOwn) {
        return errorResponse('Không có quyền xuất dữ liệu', 403);
    }


    // Build where clause
    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (activityId) where.activityId = activityId;

    if (fromDate || toDate) {
        where.spentOn = {};
        if (fromDate) where.spentOn.gte = new Date(fromDate);
        if (toDate) where.spentOn.lte = new Date(toDate + 'T23:59:59');
    }

    if (!user.isAdministrator && !canViewAll) {
        where.userId = user.id;
    } else if (userId) {
        where.userId = userId;
    }


    const timeLogs = await prisma.timeLog.findMany({
        where,
        include: {
            user: { select: { name: true } },
            activity: { select: { name: true } },
            task: { select: { number: true, title: true } },
            project: { select: { name: true } },
        },
        orderBy: [{ spentOn: 'desc' }, { createdAt: 'desc' }],
    });

    // Build CSV
    const headers = ['Ngày', 'Người thực hiện', 'Dự án', 'Công việc', 'Hoạt động', 'Bình luận', 'Giờ'];
    const rows = timeLogs.map((log) => [
        new Date(log.spentOn).toISOString().split('T')[0],
        log.user.name,
        log.project.name,
        log.task ? `#${log.task.number} ${log.task.title}` : '',
        log.activity.name,
        log.comments?.replace(/"/g, '""') || '',
        log.hours.toFixed(1),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
            row.map((cell) => `"${cell}"`).join(',')
        ),
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const bom = '\uFEFF';
    const finalCsv = bom + csvContent;

    return new Response(finalCsv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="time-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
    });
});
