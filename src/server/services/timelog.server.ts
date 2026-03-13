import prisma from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';
import * as TimeLogPolicy from '@/server/policies/timelog.policy';
import { PERMISSIONS } from '@/lib/constants';

import { SessionUser } from '@/types';
import { parsePaginationParams, buildPaginationResult } from '@/lib/pagination';

export class TimeLogServerService {
    static async getTimeLogs(user: SessionUser, searchParams: URLSearchParams) {
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const activityId = searchParams.get('activityId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        
        const { page, pageSize } = parsePaginationParams(searchParams, 'spentOn');

        const userPermissions = await getUserPermissions(user.id, projectId || undefined);

        const canViewAll = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) || user.isAdministrator;
        const canViewOwn = userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN) || user.isAdministrator;

        if (!canViewAll && !canViewOwn) {
            throw new Error('Không có quyền xem nhật ký thời gian');
        }

        const where: any = {};
        if (projectId) where.projectId = projectId;
        if (activityId) where.activityId = activityId;
        if (fromDate || toDate) {
            where.spentOn = {};
            if (fromDate) where.spentOn.gte = new Date(fromDate);
            if (toDate) where.spentOn.lte = new Date(toDate + 'T23:59:59');
        }

        if (!canViewAll) {
            where.userId = user.id;
        } else if (userId) {
            where.userId = userId;
        }

        const [timeLogs, total, totalHoursResult, availableUsers] = await Promise.all([
            prisma.timeLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    activity: { select: { id: true, name: true } },
                    task: { select: { id: true, number: true, title: true } },
                    project: { select: { id: true, name: true, identifier: true } },
                },
                orderBy: [{ spentOn: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.timeLog.count({ where }),
            prisma.timeLog.aggregate({
                where,
                _sum: { hours: true },
            }),
            canViewAll
                ? prisma.user.findMany({
                    where: { isActive: true },
                    select: { id: true, name: true },
                    orderBy: { name: 'asc' },
                })
                : Promise.resolve([]),
        ]);

        const timeLogsWithPermissions = timeLogs.map((log) => ({
            ...log,
            canEdit: TimeLogPolicy.canUpdateTimeLog(user, log, userPermissions),
            canDelete: TimeLogPolicy.canDeleteTimeLog(user, log, userPermissions),
        }));

        const canLogTime = TimeLogPolicy.canLogTime(user, userPermissions);

        return {
            timeLogs: timeLogsWithPermissions,
            totalHours: totalHoursResult._sum.hours || 0,
            canViewAll,
            canLogTime,
            users: availableUsers,
            pagination: buildPaginationResult(total, page, pageSize),
        };
    }

    static async createTimeLog(user: SessionUser, data: any) {
        const { hours, spentOn, activityId, comments, taskId, projectId } = data;

        if (!hours || hours <= 0) throw new Error('Số giờ phải lớn hơn 0');
        if (!spentOn) throw new Error('Ngày thực hiện không được để trống');
        if (!activityId) throw new Error('Hoạt động không được để trống');
        if (!projectId) throw new Error('Dự án không được để trống');

        const userPermissions = await getUserPermissions(user.id, projectId);
        const canLog = TimeLogPolicy.canLogTime(user, userPermissions);

        if (!canLog) {
            throw new Error('Bạn không có quyền ghi nhận thời gian cho dự án này');
        }

        const timeLog = await prisma.timeLog.create({
            data: {
                hours: parseFloat(hours),
                spentOn: new Date(spentOn),
                comments: comments || null,
                activityId,
                taskId: taskId || null,
                projectId,
                userId: user.id,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        return timeLog;
    }

    static async getTimeLogById(user: SessionUser, id: string) {
        const timeLog = await prisma.timeLog.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        if (!timeLog) throw new Error('Không tìm thấy bản ghi thời gian');

        const userPermissions = await getUserPermissions(user.id, timeLog.projectId);
        const canView = TimeLogPolicy.canViewTimeLog(user, timeLog, userPermissions);

        if (!canView) throw new Error('Không có quyền xem bản ghi này');

        return timeLog;
    }

    static async updateTimeLog(user: SessionUser, id: string, data: any) {
        const { hours, spentOn, activityId, comments } = data;

        const existingLog = await prisma.timeLog.findUnique({
            where: { id },
            select: { id: true, userId: true, projectId: true },
        });

        if (!existingLog) throw new Error('Không tìm thấy bản ghi thời gian');

        const userPermissions = await getUserPermissions(user.id, existingLog.projectId);
        const canUpdate = TimeLogPolicy.canUpdateTimeLog(user, existingLog, userPermissions);

        if (!canUpdate) throw new Error('Không có quyền chỉnh sửa bản ghi thời gian này');

        const updateData: any = {};
        if (hours !== undefined) updateData.hours = parseFloat(hours);
        if (spentOn) updateData.spentOn = new Date(spentOn);
        if (activityId) updateData.activityId = activityId;
        if (comments !== undefined) updateData.comments = comments || null;

        const timeLog = await prisma.timeLog.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        return timeLog;
    }

    static async deleteTimeLog(user: SessionUser, id: string) {
        const existingLog = await prisma.timeLog.findUnique({
            where: { id },
            select: { id: true, userId: true, projectId: true },
        });

        if (!existingLog) throw new Error('Không tìm thấy bản ghi thời gian');

        const userPermissions = await getUserPermissions(user.id, existingLog.projectId);
        const canDelete = TimeLogPolicy.canDeleteTimeLog(user, existingLog, userPermissions);

        if (!canDelete) throw new Error('Không có quyền xóa bản ghi thời gian này');

        await prisma.timeLog.delete({ where: { id } });
        return true;
    }
}
