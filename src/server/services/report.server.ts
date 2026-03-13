import prisma from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';
import { ReportPolicy } from '@/server/policies/report.policy';

import { SessionUser } from '@/types';

export class ReportServerService {
    static async getReport(user: SessionUser, searchParams: URLSearchParams) {
        const type = searchParams.get('type') || 'summary';
        const projectId = searchParams.get('projectId') || undefined;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const isAdmin = user.isAdministrator;
        const perms = await getUserPermissions(user.id, projectId);

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

        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const accessibleProjectsFilter: any = isAdmin ? {} : {
            members: { some: { userId: user.id } }
        };

        const now = new Date();

        switch (type) {
            case 'summary': {
                if (projectId) {
                    if (!ProjectPolicy.canViewProject(user, perms)) {
                        throw new Error('Không có quyền xem báo cáo dự án này');
                    }
                }

                const projectFilter: any = { ...accessibleProjectsFilter };
                if (projectId) projectFilter.id = projectId;

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
                    prisma.task.count({
                        where: {
                            ...taskBaseFilter,
                            status: { isClosed: true },
                            ...(startDate || endDate ? { updatedAt: dateFilter } : {})
                        },
                    }),
                    prisma.task.count({
                        where: {
                            ...taskBaseFilter,
                            status: { isClosed: false },
                            dueDate: { lt: now }
                        }
                    }),
                    prisma.timeLog.aggregate({
                        where: {
                            projectId: projectId || undefined,
                            project: projectFilter,
                            ...(startDate || endDate ? { spentOn: dateFilter } : {}),
                            ...(taskScope === 'OWN' ? { userId: user.id } : {})
                        },
                        _sum: { hours: true }
                    }).then(res => res._sum.hours || 0),
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

                const trackerDetails = await prisma.tracker.findMany({
                    where: { id: { in: trackers.map(t => t.trackerId) } },
                    select: { id: true, name: true }
                });

                const trackerBreakdown = trackers.map(t => ({
                    name: trackerDetails.find(td => td.id === t.trackerId)?.name || 'Khác',
                    count: t._count._all
                }));

                const canViewSensitive = ReportPolicy.canViewSensitiveSummary(user, perms);

                return {
                    totalProjects,
                    totalTasks,
                    openTasks: totalTasks - closedTasks,
                    closedTasks,
                    overdueTasks,
                    totalHours: canViewSensitive ? totalHours : undefined,
                    trackerBreakdown,
                    completionRate: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                };
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

                const projectReports = projects.map((p) => {
                    const periodTasks = p.tasks.filter((t: any) =>
                        !startDate && !endDate ||
                        (t.createdAt >= (dateFilter.gte || new Date(0)) && t.createdAt <= (dateFilter.lte || new Date())) ||
                        (t.updatedAt >= (dateFilter.gte || new Date(0)) && t.updatedAt <= (dateFilter.lte || new Date()))
                    );

                    const totalTasks = periodTasks.length;
                    const closedTasks = periodTasks.filter((t: any) => t.status.isClosed && (!dateFilter.gte || t.updatedAt >= dateFilter.gte)).length;
                    const overdueTasks = p.tasks.filter((t: any) => !t.status.isClosed && t.dueDate && t.dueDate < now).length;

                    return {
                        id: p.id,
                        name: p.name,
                        totalTasks,
                        totalMembers: p._count.members,
                        openTasks: totalTasks - closedTasks,
                        closedTasks,
                        overdueTasks,
                        completionRate: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                    };
                });

                return projectReports;
            }

            case 'by-user': {
                if (!ReportPolicy.canViewUserReports(user, perms)) {
                    throw new Error('Không có quyền truy cập báo cáo nhân sự');
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

                return userReports;
            }

            case 'by-time': {
                if (!ReportPolicy.canViewTimeReports(user, perms)) {
                    throw new Error('Không có quyền xem báo cáo thời gian');
                }

                const personnelScope = ReportPolicy.getPersonnelVisibilityScope(user, perms);

                let whereClause: any = {};
                if (startDate || endDate) whereClause.spentOn = dateFilter;

                if (projectId) {
                    if (!ProjectPolicy.canViewProject(user, perms)) {
                        throw new Error('Không có quyền xem nhật ký thời gian dự án này');
                    }
                    whereClause.projectId = projectId;

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
                            activities: new Map()
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

                return reportData;
            }

            default:
                throw new Error('Loại báo cáo không hợp lệ');
        }
    }

    static async getExportData(user: SessionUser, searchParams: URLSearchParams) {
        const type = searchParams.get('type') || 'tasks';
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        let csvContent = '';
        let filename = 'export';

        switch (type) {
            case 'tasks': {
                const where: Record<string, unknown> = {};

                if (projectId) {
                    const perms = await getUserPermissions(user.id, projectId);
                    if (!ProjectPolicy.canViewProject(user, perms)) {
                        throw new Error('Không có quyền xuất dữ liệu cho dự án này');
                    }
                    where.projectId = projectId;
                } else if (!user.isAdministrator) {
                    where.project = { members: { some: { userId: user.id } } };
                    where.OR = [
                        { isPrivate: false },
                        { creatorId: user.id },
                        { assigneeId: user.id }
                    ];
                }

                const globalPerms = await getUserPermissions(user.id);
                if (userId) {
                    if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF' && userId !== user.id) {
                        throw new Error('Không có quyền xuất dữ liệu của người khác');
                    }
                    where.assigneeId = userId;
                } else if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF') {
                    where.assigneeId = user.id;
                }

                if (startDate || endDate) {
                    where.createdAt = dateFilter;
                }

                const tasks = await prisma.task.findMany({
                    where,
                    include: {
                        project: { select: { name: true } },
                        tracker: { select: { name: true } },
                        status: { select: { name: true, isClosed: true } },
                        priority: { select: { name: true } },
                        assignee: { select: { name: true } },
                        creator: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                csvContent = 'Mã,Tiêu đề,Dự án,Loại,Trạng thái,Độ ưu tiên,Người thực hiện,Người tạo,Tiến độ (%),Thời gian ước lượng (h),Ngày bắt đầu,Ngày hết hạn,Ngày tạo\n';

                tasks.forEach(task => {
                    const startDateStr = task.startDate ? this.formatDateVN(task.startDate) : '';
                    const dueDateStr = task.dueDate ? this.formatDateVN(task.dueDate) : '';
                    const createdAtStr = this.formatDateVN(task.createdAt);

                    csvContent += `${task.number},"${task.title.replace(/"/g, '""')}","${task.project.name}","${task.tracker.name}","${task.status.name}","${task.priority.name}","${task.assignee?.name || ''}","${task.creator.name}",${task.doneRatio},${task.estimatedHours || ''},"${startDateStr}","${dueDateStr}","${createdAtStr}"\n`;
                });

                filename = `cong-viec_${this.formatDateForFilename(startDate, endDate)}`;
                break;
            }

            case 'time-logs': {
                const globalPerms = await getUserPermissions(user.id);
                if (!ReportPolicy.canViewTimeReports(user, globalPerms)) {
                    throw new Error('Không có quyền nâng cao để xuất báo cáo thời gian');
                }

                const where: Record<string, unknown> = {};

                if (startDate || endDate) {
                    where.spentOn = dateFilter;
                }

                if (projectId) {
                    const perms = await getUserPermissions(user.id, projectId);
                    if (!ProjectPolicy.canViewProject(user, perms)) {
                        throw new Error('Không có quyền xuất dữ liệu cho dự án này');
                    }
                    where.projectId = projectId;
                } else if (!user.isAdministrator) {
                    where.project = { members: { some: { userId: user.id } } };
                }

                if (userId) {
                    if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF' && userId !== user.id) {
                        throw new Error('Không có quyền xuất dữ liệu của người khác');
                    }
                    where.userId = userId;
                } else if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF') {
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
                });

                csvContent = 'Ngày,Người thực hiện,Dự án,Tên công việc,Hoạt động,Giờ,Mô tả\n';

                timeLogs.forEach(log => {
                    const spentOnStr = this.formatDateVN(log.spentOn);
                    const taskTitle = log.task ? `#${log.task.number} ${log.task.title}` : '-';
                    const comments = log.comments ? log.comments.replace(/"/g, '""') : '';

                    csvContent += `"${spentOnStr}","${log.user.name}","${log.project.name}","${taskTitle.replace(/"/g, '""')}","${log.activity.name}",${log.hours},"${comments}"\n`;
                });

                filename = `thoi-gian_${this.formatDateForFilename(startDate, endDate)}`;
                break;
            }

            case 'project-summary': {
                const where: Record<string, unknown> = { isArchived: false };

                if (projectId) {
                    const perms = await getUserPermissions(user.id, projectId);
                    if (!ProjectPolicy.canViewProject(user, perms)) {
                        throw new Error('Không có quyền xuất dữ liệu cho dự án này');
                    }
                    where.id = projectId;
                } else if (!user.isAdministrator) {
                    where.members = { some: { userId: user.id } };
                }

                const projects = await prisma.project.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        identifier: true,
                        startDate: true,
                        endDate: true,
                        _count: { select: { tasks: true, members: true } },
                        tasks: {
                            select: {
                                status: { select: { isClosed: true } },
                                estimatedHours: true,
                            },
                            where: startDate || endDate ? { createdAt: dateFilter } : undefined,
                        },
                    },
                });

                csvContent = 'Mã định danh,Tên dự án,Thành viên,Tổng task,Task mở,Task đóng,Tiến độ (%),Tổng giờ ước lượng,Ngày bắt đầu,Ngày kết thúc\n';

                projects.forEach(p => {
                    const closedTasks = p.tasks.filter(t => t.status.isClosed).length;
                    const openTasks = p.tasks.length - closedTasks;
                    const progress = p.tasks.length > 0 ? Math.round((closedTasks / p.tasks.length) * 100) : 0;
                    const totalHours = p.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
                    const pStartDate = p.startDate ? this.formatDateVN(p.startDate) : '';
                    const pEndDate = p.endDate ? this.formatDateVN(p.endDate) : '';

                    csvContent += `${p.identifier},"${p.name}",${p._count.members},${p.tasks.length},${openTasks},${closedTasks},${progress},${totalHours.toFixed(1)},"${pStartDate}","${pEndDate}"\n`;
                });

                filename = `tong-hop-du-an_${this.formatDateForFilename(startDate, endDate)}`;
                break;
            }

            case 'user-summary': {
                const globalPerms = await getUserPermissions(user.id);
                if (ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) !== 'ALL') {
                    throw new Error('Không có quyền nâng cao để xuất báo cáo người dùng');
                }

                const userWhere: Record<string, unknown> = { isActive: true };
                if (userId) {
                    userWhere.id = userId;
                }

                const taskDateFilter = startDate || endDate ? { createdAt: dateFilter } : {};
                const projectFilter = projectId ? { projectId } : {};

                const users = await prisma.user.findMany({
                    where: userWhere,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        assignedTasks: {
                            where: { ...taskDateFilter, ...projectFilter },
                            select: {
                                status: { select: { isClosed: true } },
                                estimatedHours: true,
                            },
                        },
                    },
                });

                csvContent = 'Tên,Email,Tổng task được gán,Task mở,Task đóng,Hiệu suất (%),Tổng giờ ước lượng\n';

                users.forEach(u => {
                    const closedTasks = u.assignedTasks.filter(t => t.status.isClosed).length;
                    const openTasks = u.assignedTasks.length - closedTasks;
                    const perf = u.assignedTasks.length > 0 ? Math.round((closedTasks / u.assignedTasks.length) * 100) : 0;
                    const totalHours = u.assignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

                    csvContent += `"${u.name}","${u.email}",${u.assignedTasks.length},${openTasks},${closedTasks},${perf},${totalHours.toFixed(1)}\n`;
                });

                filename = `tong-hop-nhan-su_${this.formatDateForFilename(startDate, endDate)}`;
                break;
            }

            default:
                throw new Error('Loại export không hợp lệ');
        }

        return { content: csvContent, filename };
    }

    private static formatDateForFilename(startDate: string | null, endDate: string | null): string {
        if (startDate && endDate) {
            return `${startDate}_${endDate}`;
        } else if (startDate) {
            return `from_${startDate}`;
        } else if (endDate) {
            return `to_${endDate}`;
        }
        return new Date().toISOString().split('T')[0];
    }

    private static formatDateVN(date: Date | string | null | undefined): string {
        if (!date) return '';

        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    }
}
