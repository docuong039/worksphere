import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/dashboard - Lấy dữ liệu dashboard
export async function GET() {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const userId = session.user.id;
        const isAdmin = session.user.isAdministrator;

        // Get user's projects
        const projectFilter = isAdmin
            ? {}
            : { members: { some: { userId } } };

        // Tasks assigned to user
        const myTasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
                status: { isClosed: false },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                title: true,
                dueDate: true,
                status: { select: { id: true, name: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: { select: { id: true, name: true } },
            },
        });

        // Overdue tasks
        const overdueTasks = await prisma.task.count({
            where: {
                assigneeId: userId,
                status: { isClosed: false },
                dueDate: { lt: new Date() },
            },
        });

        // Tasks due this week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const dueSoonTasks = await prisma.task.count({
            where: {
                assigneeId: userId,
                status: { isClosed: false },
                dueDate: {
                    gte: new Date(),
                    lte: nextWeek,
                },
            },
        });

        // Recent activity (tasks updated recently)
        const recentActivity = await prisma.task.findMany({
            where: isAdmin
                ? {}
                : {
                    project: { members: { some: { userId } } },
                },
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                title: true,
                updatedAt: true,
                status: { select: { name: true } },
                assignee: { select: { name: true, avatar: true } },
                project: { select: { name: true } },
            },
        });

        // Project stats
        const projects = await prisma.project.findMany({
            where: {
                ...projectFilter,
                isArchived: false,
            },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { tasks: true, members: true },
                },
            },
            take: 5,
        });

        // Task stats by status
        const taskStats = await prisma.task.groupBy({
            by: ['statusId'],
            where: isAdmin
                ? {}
                : {
                    project: { members: { some: { userId } } },
                },
            _count: true,
        });

        // Get status names
        const statuses = await prisma.status.findMany({
            select: { id: true, name: true, isClosed: true },
            orderBy: { position: 'asc' },
        });

        const tasksByStatus = statuses.map((status) => ({
            status,
            count: taskStats.find((s) => s.statusId === status.id)?._count || 0,
        }));

        // Unread notifications count
        const unreadNotifications = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        return successResponse({
            myTasks,
            overdueTasks,
            dueSoonTasks,
            recentActivity,
            projects,
            tasksByStatus,
            unreadNotifications,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
