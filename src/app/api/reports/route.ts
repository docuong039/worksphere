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
        const userId = searchParams.get('userId');

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
                        where: { project: projectFilter as any },
                    }),
                    prisma.task.count({
                        where: { project: projectFilter as any, status: { isClosed: false } },
                    }),
                    prisma.task.count({
                        where: { project: projectFilter as any, status: { isClosed: true } },
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

            case 'by-activity': {
                // Báo cáo theo hoạt động
                const timeFilter: any = { ...dateFilter };
                if (projectId) {
                    timeFilter.task = { projectId };
                }

                const timeLogs = await (prisma.timeLog as any).groupBy({
                    by: ['activity'],
                    where: timeFilter,
                    _sum: { hours: true },
                });

                const activityReports = timeLogs.map((log: any) => ({
                    name: log.activity || 'Khác',
                    hours: log._sum?.hours || 0,
                }));

                return successResponse({
                    type: 'by-activity',
                    data: activityReports,
                });
            }

            default:
                return errorResponse('Loại báo cáo không hợp lệ', 400);
        }
    } catch (error) {
        return handleApiError(error);
    }
}
