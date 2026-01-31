import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, handleApiError } from '@/lib/api-error';
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

        const isAdmin = session.user.isAdministrator;
        const canViewAll = await hasPermission(session.user, 'timelogs.view_all');
        const canViewOwn = await hasPermission(session.user, 'timelogs.view_own');

        if (!isAdmin && !canViewAll && !canViewOwn) {
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

        if (!isAdmin && !canViewAll) {
            where.userId = session.user.id;
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
                'Content-Disposition': `attachment; filename="spent-time-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
