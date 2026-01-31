import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/reports - Lấy báo cáo
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'summary';
        const projectId = searchParams.get('projectId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const isAdmin = session.user.isAdministrator;

        // Date filters
        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        switch (type) {
            case 'summary': {
                // Overall summary report
                const projectFilter = isAdmin
                    ? projectId ? { id: projectId } : {}
                    : { members: { some: { userId: session.user.id } }, ...(projectId && { id: projectId }) };

                const [
                    totalProjects,
                    totalTasks,
                    openTasks,
                    closedTasks,
                ] = await Promise.all([
                    prisma.project.count({ where: { ...projectFilter, isArchived: false } }),
                    prisma.task.count({
                        where: { project: projectFilter },
                    }),
                    prisma.task.count({
                        where: { project: projectFilter, status: { isClosed: false } },
                    }),
                    prisma.task.count({
                        where: { project: projectFilter, status: { isClosed: true } },
                    }),
                ]);

                return successResponse({
                    type: 'summary',
                    data: {
                        totalProjects,
                        totalTasks,
                        openTasks,
                        closedTasks,
                        completionRate: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                    },
                });
            }

            case 'by-project': {
                // Report by project
                const projects = await prisma.project.findMany({
                    where: isAdmin
                        ? { isArchived: false }
                        : { members: { some: { userId: session.user.id } }, isArchived: false },
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: { tasks: true, members: true },
                        },
                        tasks: {
                            select: {
                                status: { select: { isClosed: true } },
                            },
                        },
                    },
                });

                const projectReports = projects.map((p) => {
                    const closedTasks = p.tasks.filter((t) => t.status.isClosed).length;
                    const openTasks = p.tasks.length - closedTasks;

                    return {
                        id: p.id,
                        name: p.name,
                        totalTasks: p._count.tasks,
                        totalMembers: p._count.members,
                        openTasks,
                        closedTasks,
                        completionRate: p._count.tasks > 0
                            ? Math.round((closedTasks / p._count.tasks) * 100)
                            : 0,
                    };
                });

                return successResponse({
                    type: 'by-project',
                    data: projectReports,
                });
            }

            case 'by-user': {
                // Report by user (admin only)
                if (!isAdmin) {
                    return errorResponse('Không có quyền truy cập', 403);
                }

                const users = await prisma.user.findMany({
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        assignedTasks: {
                            where: projectId ? { projectId } : {},
                            select: { status: { select: { isClosed: true } } },
                        },
                    },
                });

                const userReports = users.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    totalAssigned: u.assignedTasks.length,
                    openTasks: u.assignedTasks.filter((t) => !t.status.isClosed).length,
                    closedTasks: u.assignedTasks.filter((t) => t.status.isClosed).length,
                }));

                return successResponse({
                    type: 'by-user',
                    data: userReports,
                });
            }

            case 'by-time': {
                // Time Tracking Report
                // Aggregate time logs by Project (and User details within)

                // Base filter
                let whereClause: any = {};

                if (startDate) whereClause.spentOn = { ...whereClause.spentOn, gte: new Date(startDate) };
                if (endDate) whereClause.spentOn = { ...whereClause.spentOn, lte: new Date(endDate) };
                if (projectId) whereClause.projectId = projectId;

                // If not admin, only see own logs or projects member is part of (simplified to own logs for strict privacy, or project based)
                // Here letting non-admin see logs if they are project members is common, but let's restrict to accessible projects
                if (!isAdmin) {
                    whereClause.project = {
                        members: { some: { userId: session.user.id } }
                    };
                }

                const timeLogs = await prisma.timeLog.findMany({
                    where: whereClause,
                    include: {
                        project: { select: { id: true, name: true } },
                        user: { select: { id: true, name: true, avatar: true } },
                        activity: { select: { id: true, name: true } }
                    },
                    orderBy: { spentOn: 'desc' }
                });

                // Group by User for the report view
                const userMap = new Map<string, {
                    userId: string;
                    userName: string;
                    totalHours: number;
                    projects: Map<string, number>; // ProjectId -> Hours
                }>();

                for (const log of timeLogs) {
                    const userId = log.userId;
                    if (!userMap.has(userId)) {
                        userMap.set(userId, {
                            userId: log.user.id,
                            userName: log.user.name,
                            totalHours: 0,
                            projects: new Map()
                        });
                    }

                    const userData = userMap.get(userId)!;
                    userData.totalHours += log.hours;

                    const currentProjHours = userData.projects.get(log.project.name) || 0;
                    userData.projects.set(log.project.name, currentProjHours + log.hours);
                }

                // Convert Map to Array
                const reportData = Array.from(userMap.values()).map(u => ({
                    ...u,
                    projects: Object.fromEntries(u.projects) // Convert inner Map to Object for JSON
                }));

                return successResponse({
                    type: 'by-time',
                    data: reportData
                });
            }

            default:
                return errorResponse('Loại báo cáo không hợp lệ', 400);
        }
    } catch (error) {
        return handleApiError(error);
    }
}
