import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { hasPermission } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const isAdmin = session.user.isAdministrator;

        // Check permissions (Sử dụng quyền xem công việc vì đây là thống kê giờ ước tính)
        const canViewAll = await hasPermission(session.user, 'tasks.view_all');
        const canViewOwn = true; // Ai cũng có thể xem khối lượng của mình

        if (!isAdmin && !canViewAll && !canViewOwn) {
            return errorResponse('Không có quyền xem thống kê thời gian', 403);
        }

        // Build where clause
        const where: Prisma.TaskWhereInput = {
            assigneeId: { not: null },
            estimatedHours: { not: null, gt: 0 },
        };

        if (projectId) {
            where.projectId = projectId;
        }

        if (!isAdmin && !canViewAll) {
            where.assigneeId = session.user.id;
        }

        if (userId) {
            if (!isAdmin && !canViewAll && userId !== session.user.id) {
                return errorResponse('Không có quyền xem thời gian của người khác', 403);
            }

            where.assigneeId = userId;

            const [tasks, total] = await Promise.all([
                prisma.task.findMany({
                    where,
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        estimatedHours: true,
                        doneRatio: true,
                        status: { select: { id: true, name: true, isClosed: true } },
                        tracker: { select: { id: true, name: true } },
                        parent: { select: { id: true, number: true, title: true } },
                        project: { select: { id: true, name: true, identifier: true } },
                    },
                    orderBy: { updatedAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.task.count({ where }),
            ]);

            const totalHoursResult = await prisma.task.aggregate({
                where,
                _sum: { estimatedHours: true },
            });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, avatar: true },
            });

            return successResponse({
                user,
                tasks,
                totalHours: totalHoursResult._sum.estimatedHours || 0,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }

        const tasksByUser = await prisma.task.groupBy({
            by: ['assigneeId'],
            where,
            _sum: { estimatedHours: true },
            _count: { id: true },
        });

        const userIds = tasksByUser.map((t) => t.assigneeId).filter((id): id is string => id !== null);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, avatar: true },
        });

        const summary = users.map((u) => {
            const taskStat = tasksByUser.find((t) => t.assigneeId === u.id);
            return {
                userId: u.id,
                userName: u.name,
                avatar: u.avatar,
                totalHours: taskStat?._sum.estimatedHours || 0,
                taskCount: taskStat?._count.id || 0,
            };
        }).sort((a, b) => b.totalHours - a.totalHours);

        const grandTotal = summary.reduce((sum, u) => sum + u.totalHours, 0);

        return successResponse({
            summary,
            grandTotal,
            userCount: summary.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
