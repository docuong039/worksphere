import prisma from '@/lib/prisma';

export class WorkflowServerService {
    static async getWorkflowMatrix(searchParams: URLSearchParams) {
        const trackerId = searchParams.get('trackerId');
        const roleId = searchParams.get('roleId');

        // Lấy tất cả trackers, statuses, roles
        const [trackers, statuses, roles] = await Promise.all([
            prisma.tracker.findMany({ orderBy: { position: 'asc' } }),
            prisma.status.findMany({ orderBy: { position: 'asc' } }),
            prisma.role.findMany({ orderBy: { name: 'asc' } }),
        ]);

        // Lấy transitions (filter nếu có params)
        const transitions = await prisma.workflowTransition.findMany({
            where: {
                ...(trackerId ? { trackerId } : {}),
                ...(roleId !== undefined ? { roleId: roleId || null } : {}),
            },
            select: {
                id: true,
                trackerId: true,
                roleId: true,
                fromStatusId: true,
                toStatusId: true,
            },
        });

        return {
            trackers,
            statuses,
            roles,
            transitions,
        };
    }

    static async updateWorkflowTransitions(data: { trackerId: string; roleId?: string; transitions: any[] }) {
        const { trackerId, roleId, transitions } = data;

        if (!trackerId) {
            throw new Error('Tracker ID là bắt buộc-400');
        }

        if (!Array.isArray(transitions)) {
            throw new Error('Transitions phải là một mảng-400');
        }

        // Xóa tất cả transitions cũ cho tracker + role này
        await prisma.workflowTransition.deleteMany({
            where: {
                trackerId,
                roleId: roleId || null,
            },
        });

        // Tạo transitions mới
        const newTransitions = transitions
            .filter((t: { allowed: boolean }) => t.allowed)
            .map((t: { fromStatusId: string; toStatusId: string }) => ({
                trackerId,
                roleId: roleId || null,
                fromStatusId: t.fromStatusId,
                toStatusId: t.toStatusId,
            }));

        if (newTransitions.length > 0) {
            await prisma.workflowTransition.createMany({
                data: newTransitions,
            });
        }

        return {
            message: 'Đã cập nhật workflow',
            count: newTransitions.length,
        };
    }
}
