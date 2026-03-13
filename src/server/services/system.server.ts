import prisma from '@/lib/prisma';
import { SessionUser } from '@/types';

export class SystemServerService {
    /**
     * Lấy danh sách độ ưu tiên
     */
    static async getPriorities(user: SessionUser) {
        if (!user.isAdministrator) {
            throw new Error('Chỉ Quản trị viên mới có quyền xem.');
        }

        return prisma.priority.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }

    /**
     * Lấy danh sách vai trò và quyền hạn
     */
    static async getRolesData(user: SessionUser) {
        if (!user.isAdministrator) {
            throw new Error('Chỉ Quản trị viên mới có quyền xem.');
        }

        const [roles, permissions, trackers] = await Promise.all([
            prisma.role.findMany({
                orderBy: { name: 'asc' },
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                    trackers: true,
                    _count: {
                        select: { projectMembers: true },
                    },
                },
            }),
            prisma.permission.findMany({
                orderBy: [{ module: 'asc' }, { name: 'asc' }],
            }),
            prisma.tracker.findMany({
                orderBy: { position: 'asc' }
            }),
        ]);

        return { roles, permissions, trackers };
    }

    /**
     * Lấy danh sách trạng thái
     */
    static async getStatuses(user: SessionUser) {
        if (!user.isAdministrator) {
            throw new Error('Chỉ Quản trị viên mới có quyền xem.');
        }

        return prisma.status.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }

    /**
     * Lấy danh sách loại công việc (Tracker)
     */
    static async getTrackers(user: SessionUser) {
        if (!user.isAdministrator) {
            throw new Error('Chỉ Quản trị viên mới có quyền xem.');
        }

        return prisma.tracker.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }

    /**
     * Lấy danh sách workflow data
     */
    static async getWorkflowData(user: SessionUser) {
        if (!user.isAdministrator) {
            throw new Error('Chỉ Quản trị viên mới có quyền xem.');
        }

        const [roles, trackers, statuses, workflowTransitions] = await Promise.all([
            prisma.role.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
            prisma.tracker.findMany({ orderBy: { position: 'asc' } }),
            prisma.status.findMany({ orderBy: { position: 'asc' } }),
            prisma.workflowTransition.findMany(),
        ]);

        const mappedTransitions = workflowTransitions.map((t: any) => ({
            ...t,
            allowed: true // Prisma only stores allowed transitions
        }));

        return {
            roles,
            trackers,
            statuses,
            mappedTransitions,
        };
    }
}
