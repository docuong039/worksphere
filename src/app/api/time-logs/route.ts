import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { hasPermission } from '@/lib/permissions';

// GET /api/time-logs - Lấy tổng hợp thời gian làm việc dựa trên estimatedHours của Task
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId'); // Xem chi tiết của 1 user cụ thể
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const isAdmin = session.user.isAdministrator;

        // Check permissions
        const canViewAll = await hasPermission(session.user as any, 'timelogs.view_all');
        const canViewOwn = await hasPermission(session.user as any, 'timelogs.view_own');

        if (!isAdmin && !canViewAll && !canViewOwn) {
            return errorResponse('Không có quyền xem thống kê thời gian', 403);
        }

        // Build where clause
        const where: any = {
            assigneeId: { not: null },
            estimatedHours: { not: null, gt: 0 },
        };

        if (projectId) {
            where.projectId = projectId;
        }

        // Nếu không phải admin và không có quyền view_all, chỉ xem được task của mình
        if (!isAdmin && !canViewAll) {
            where.assigneeId = session.user.id;
        }

        // ===== CHẾ ĐỘ CHI TIẾT: Xem danh sách task của 1 user =====
        if (userId) {
            // Kiểm tra quyền: admin, có view_all, hoặc xem của chính mình
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

            // Lấy tổng giờ
            const totalHoursResult = await prisma.task.aggregate({
                where,
                _sum: { estimatedHours: true },
            });

            // Lấy thông tin user
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

        // ===== CHẾ ĐỘ TỔNG HỢP: Xem tổng giờ theo từng user =====
        // Lấy tất cả assignee có task với estimatedHours
        const tasksByUser = await prisma.task.groupBy({
            by: ['assigneeId'],
            where,
            _sum: { estimatedHours: true },
            _count: { id: true },
        });

        // Lấy thông tin các user
        const userIds = tasksByUser.map((t) => t.assigneeId).filter(Boolean) as string[];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, avatar: true },
        });

        // Gộp lại thành summary
        const summary = tasksByUser
            .map((t) => {
                const user = users.find((u) => u.id === t.assigneeId);
                return {
                    userId: t.assigneeId,
                    userName: user?.name || 'Unknown',
                    avatar: user?.avatar,
                    totalHours: t._sum.estimatedHours || 0,
                    taskCount: t._count.id,
                };
            })
            .sort((a, b) => b.totalHours - a.totalHours);

        // Tính tổng toàn bộ
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

