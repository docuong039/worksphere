import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';

import { ReportPolicy } from '@/modules/report/report.policy';

// GET /api/reports - Lấy báo cáo
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary';
    const projectId = searchParams.get('projectId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const isAdmin = user.isAdministrator;
    // Lấy quyền một lần để dùng xuyên suốt
    const perms = await getUserPermissions(user.id, projectId);

    // Chuẩn nghiệp vụ: Xác định danh sách nhân sự được phép nhìn thấy
    // Admin quản lý hệ thống → không hiển thị trong báo cáo nhân sự
    let personnelFilter: any = { isActive: true, isAdministrator: false };
    if (!isAdmin) {
        personnelFilter.projectMemberships = {
            some: {
                project: {
                    members: {
                        some: {
                            userId: user.id,
                            role: { permissions: { some: { permission: { key: 'projects.edit' } } } }
                        }
                    }
                }
            }
        };
    }

    // Date filters for Prisma
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Filter projects the user can access
    const accessibleProjectsFilter: any = isAdmin ? {} : {
        members: { some: { userId: user.id } }
    };

    const now = new Date();

    switch (type) {
        case 'summary': {
            if (projectId) {
                if (!ProjectPolicy.canViewProject(user, perms)) {
                    return errorResponse('Không có quyền xem báo cáo dự án này', 403);
                }
            }

            const projectFilter: any = { ...accessibleProjectsFilter };
            if (projectId) projectFilter.id = projectId;

            // Áp dụng quyền xem Task (Chuẩn Enterprise)
            const taskScope = ReportPolicy.getTaskVisibilityScope(user, perms);
            const taskBaseFilter: any = {
                projectId: projectId || undefined,
                project: projectFilter,
                ...(taskScope === 'OWN' ? { assigneeId: user.id } : {})
            };

            const [
                totalProjects,
                totalTasks,
                closedTasks,
                overdueTasks,
                totalHours,
                trackers
            ] = await Promise.all([
                prisma.project.count({ where: { ...projectFilter, isArchived: false } }),
                // Tasks involved in this period (created or updated)
                prisma.task.count({
                    where: {
                        ...taskBaseFilter,
                        ...(startDate || endDate ? {
                            OR: [
                                { createdAt: dateFilter },
                                { updatedAt: dateFilter }
                            ]
                        } : {})
                    },
                }),
                // Tasks completed in this period
                prisma.task.count({
                    where: {
                        ...taskBaseFilter,
                        status: { isClosed: true },
                        ...(startDate || endDate ? { updatedAt: dateFilter } : {})
                    },
                }),
                // Tasks overdue (not closed and past due date)
                prisma.task.count({
                    where: {
                        ...taskBaseFilter,
                        status: { isClosed: false },
                        dueDate: { lt: now }
                    }
                }),
                // Total hours spent (Logic giờ làm luôn check riêng theo permission nhạy cảm)
                prisma.timeLog.aggregate({
                    where: {
                        projectId: projectId || undefined,
                        project: projectFilter,
                        ...(startDate || endDate ? { spentOn: dateFilter } : {}),
                        // Nếu là nhân viên, chỉ thấy giờ mình log
                        ...(taskScope === 'OWN' ? { userId: user.id } : {})
                    },
                    _sum: { hours: true }
                }).then(res => res._sum.hours || 0),
                // Breakdown by Tracker (Bug, Feature, etc)
                prisma.task.groupBy({
                    by: ['trackerId'],
                    where: {
                        ...taskBaseFilter,
                        ...(startDate || endDate ? {
                            OR: [
                                { createdAt: dateFilter },
                                { updatedAt: dateFilter }
                            ]
                        } : {})
                    },
                    _count: { _all: true }
                })
            ]);

            // Fetch tracker names for labels
            const trackerDetails = await prisma.tracker.findMany({
                where: { id: { in: trackers.map(t => t.trackerId) } },
                select: { id: true, name: true }
            });

            const trackerBreakdown = trackers.map(t => ({
                name: trackerDetails.find(td => td.id === t.trackerId)?.name || 'Khác',
                count: t._count._all
            }));

            const canViewSensitive = ReportPolicy.canViewSensitiveSummary(user, perms);

            return successResponse({
                totalProjects,
                totalTasks,
                openTasks: totalTasks - closedTasks,
                closedTasks,
                overdueTasks,
                totalHours: canViewSensitive ? totalHours : undefined,
                trackerBreakdown,
                completionRate: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
            });
        }

        case 'by-project': {
            const taskScope = ReportPolicy.getTaskVisibilityScope(user, perms);

            const projects = await prisma.project.findMany({
                where: { ...accessibleProjectsFilter, isArchived: false },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: { members: true },
                    },
                    tasks: {
                        where: {
                            ...(taskScope === 'OWN' ? { assigneeId: user.id } : {})
                        },
                        select: {
                            status: { select: { isClosed: true } },
                            updatedAt: true,
                            createdAt: true,
                            dueDate: true
                        },
                    },
                },
            });

            const projectReports = (projects as any[]).map((p) => {
                const periodTasks = (p.tasks as any[]).filter((t: any) =>
                    !startDate && !endDate ||
                    (t.createdAt >= (dateFilter.gte || new Date(0)) && t.createdAt <= (dateFilter.lte || new Date())) ||
                    (t.updatedAt >= (dateFilter.gte || new Date(0)) && t.updatedAt <= (dateFilter.lte || new Date()))
                );

                const totalTasks = periodTasks.length;
                const closedTasks = periodTasks.filter((t: any) => t.status.isClosed && (!dateFilter.gte || t.updatedAt >= dateFilter.gte)).length;
                const overdueTasks = (p.tasks as any[]).filter((t: any) => !t.status.isClosed && t.dueDate && t.dueDate < now).length;

                return {
                    id: p.id,
                    name: p.name,
                    totalTasks,
                    totalMembers: (p as any)._count.members,
                    openTasks: totalTasks - closedTasks,
                    closedTasks,
                    overdueTasks,
                    completionRate: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                };
            });

            return successResponse(projectReports);
        }

        case 'by-user': {
            if (!ReportPolicy.canViewUserReports(user, perms)) {
                return errorResponse('Không có quyền truy cập báo cáo nhân sự', 403);
            }

            const users = await prisma.user.findMany({
                where: personnelFilter,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    assignedTasks: {
                        where: {
                            ...(projectId ? { projectId } : {}),
                        },
                        select: {
                            status: { select: { isClosed: true } },
                            updatedAt: true,
                            createdAt: true,
                            dueDate: true
                        },
                    },
                },
            });

            const userReports = users.map((u) => {
                const periodTasks = u.assignedTasks.filter(t =>
                    !startDate && !endDate ||
                    (t.createdAt >= (dateFilter.gte || new Date(0)) && t.createdAt <= (dateFilter.lte || new Date())) ||
                    (t.updatedAt >= (dateFilter.gte || new Date(0)) && t.updatedAt <= (dateFilter.lte || new Date()))
                );

                const totalInPeriod = periodTasks.length;
                const closedInPeriod = periodTasks.filter(t => t.status.isClosed && (!dateFilter.gte || t.updatedAt >= dateFilter.gte)).length;
                const overdueTasks = u.assignedTasks.filter(t => !t.status.isClosed && t.dueDate && t.dueDate < now).length;

                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    totalAssigned: totalInPeriod,
                    openTasks: totalInPeriod - closedInPeriod,
                    closedTasks: closedInPeriod,
                    overdueTasks,
                };
            });

            return successResponse(userReports);
        }

        case 'by-time': {
            if (!ReportPolicy.canViewTimeReports(user, perms)) {
                return errorResponse('Không có quyền xem báo cáo thời gian', 403);
            }

            const personnelScope = ReportPolicy.getPersonnelVisibilityScope(user, perms);

            let whereClause: any = {};
            if (startDate || endDate) whereClause.spentOn = dateFilter;

            if (projectId) {
                if (!ProjectPolicy.canViewProject(user, perms)) {
                    return errorResponse('Không có quyền xem nhật ký thời gian dự án này', 403);
                }
                whereClause.projectId = projectId;

                // If not admin and only SELF scope, force filter by user.id
                if (!isAdmin && personnelScope === 'SELF') {
                    whereClause.userId = user.id;
                }
            } else if (!isAdmin) {
                if (personnelScope === 'SELF') {
                    whereClause.userId = user.id;
                } else if (personnelScope === 'PROJECT_MEMBERS') {
                    whereClause.project = {
                        members: { some: { userId: user.id } }
                    };
                    // Optional: exclude admins if needed, or keep it per personnelFilter logic
                    whereClause.user = { isAdministrator: false };
                }
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

            const userMap = new Map<string, any>();
            for (const log of timeLogs) {
                if (!userMap.has(log.userId)) {
                    userMap.set(log.userId, {
                        userId: log.user.id,
                        userName: log.user.name,
                        totalHours: 0,
                        projects: new Map(),
                        activities: new Map() // Thống kê theo loại công việc
                    });
                }
                const data = userMap.get(log.userId)!;
                data.totalHours += log.hours;

                const currentProj = data.projects.get(log.project.name) || 0;
                data.projects.set(log.project.name, currentProj + log.hours);

                const currentAct = data.activities.get(log.activity.name) || 0;
                data.activities.set(log.activity.name, currentAct + log.hours);
            }

            const reportData = Array.from(userMap.values()).map(u => ({
                ...u,
                projects: Object.fromEntries(u.projects),
                activities: Object.fromEntries(u.activities)
            }));

            return successResponse(reportData);
        }

        default:
            return errorResponse('Loại báo cáo không hợp lệ', 400);
    }
});
