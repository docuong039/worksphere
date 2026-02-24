import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';

// GET /api/dashboard - Lấy dữ liệu dashboard
export const GET = withAuth(async (_req, user) => {
    const userId = user.id;
    const isAdmin = user.isAdministrator;

    // Get user's projects filter
    const projectFilter = isAdmin
        ? {}
        : { members: { some: { userId } } };

    // Get projects user manages or has access to
    const managedProjects = await prisma.project.findMany({
        where: {
            ...projectFilter,
            isArchived: false,
        },
        include: {
            _count: {
                select: { tasks: true, members: true },
            },
            tasks: {
                where: { status: { isClosed: false } },
                select: { id: true, dueDate: true, assigneeId: true, priorityId: true }
            },
            creator: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
    });

    // Calculate detailed stats for each project
    const projectSummaries = managedProjects.map(proj => {
        const totalTasks = proj._count.tasks;
        const openTasks = proj.tasks.length;
        const closedTasks = totalTasks - openTasks;

        const overdueTasksCount = proj.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
        const unassignedTasksCount = proj.tasks.filter(t => !t.assigneeId).length;

        const completionRate = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

        return {
            id: proj.id,
            name: proj.name,
            totalTasks,
            closedTasks,
            overdueTasksCount,
            unassignedTasksCount,
            completionRate,
            memberCount: proj._count.members,
            creatorName: proj.creator.name
        };
    });

    // Global stats for the portfolio (Admin/Manager view)
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const portfolioStats = {
        totalProjects: await prisma.project.count({ where: { ...projectFilter, isArchived: false } }),
        totalOverdueGlobal: projectSummaries.reduce((sum, p) => sum + p.overdueTasksCount, 0),
        totalUnassignedGlobal: projectSummaries.reduce((sum, p) => sum + p.unassignedTasksCount, 0),
        upcomingProjects: await prisma.project.count({
            where: {
                ...projectFilter,
                isArchived: false,
                endDate: {
                    gte: now,
                    lte: next7Days
                }
            }
        })
    };

    // My personal tasks (Keep current logic)
    const myTasks = await prisma.task.findMany({
        where: {
            assigneeId: userId,
            status: { isClosed: false },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            dueDate: true,
            status: { select: { id: true, name: true } },
            priority: { select: { id: true, name: true, color: true } },
            project: { select: { id: true, name: true } },
        },
    });

    // Recent activity (Limited to accessible projects)
    const recentActivity = await prisma.task.findMany({
        where: isAdmin
            ? {}
            : {
                project: { members: { some: { userId } } },
                OR: [
                    { isPrivate: false },
                    { creatorId: userId },
                    { assigneeId: userId }
                ]
            },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
            id: true,
            title: true,
            updatedAt: true,
            status: { select: { name: true } },
            assignee: { select: { name: true, avatar: true } },
            project: { select: { name: true } },
        },
    });

    return successResponse({
        portfolioStats,
        projectSummaries,
        myTasks,
        recentActivity,
    });
});
