import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';

// GET /api/workflow/allowed-transitions - Kiểm tra transitions được phép
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const fromStatusId = searchParams.get('fromStatusId');

    if (!taskId && !fromStatusId) {
        return errorResponse('Cần taskId hoặc fromStatusId', 400);
    }

    let trackerId: string;
    let currentStatusId: string;
    let projectId: string | null = null;

    if (taskId) {
        // Lấy thông tin task
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { trackerId: true, statusId: true, projectId: true },
        });

        if (!task) {
            return errorResponse('Task không tồn tại', 404);
        }

        trackerId = task.trackerId;
        currentStatusId = task.statusId;
        projectId = task.projectId;
    } else {
        // Cần tracker để check
        const trackerIdParam = searchParams.get('trackerId');
        if (!trackerIdParam || !fromStatusId) {
            return errorResponse('Cần trackerId và fromStatusId', 400);
        }
        trackerId = trackerIdParam;
        currentStatusId = fromStatusId;
    }

    // Administrator có thể chuyển bất kỳ status nào
    if (user.isAdministrator) {
        const statuses = await prisma.status.findMany({
            orderBy: { position: 'asc' },
            select: { id: true, name: true, isClosed: true },
        });
        return successResponse(statuses.filter(s => s.id !== currentStatusId));
    }

    // Lấy roles của user trong project
    let roleIds: string[] = [];
    if (projectId) {
        const memberships = await prisma.projectMember.findMany({
            where: {
                userId: user.id,
                projectId,
            },
            select: { roleId: true },
        });
        roleIds = memberships.map(m => m.roleId);
    }

    // Lấy allowed transitions
    const transitions = await prisma.workflowTransition.findMany({
        where: {
            trackerId,
            fromStatusId: currentStatusId,
            OR: [
                { roleId: null }, // Áp dụng cho tất cả roles
                { roleId: { in: roleIds } },
            ],
        },
        include: {
            toStatus: {
                select: { id: true, name: true, isClosed: true },
            },
        },
    });

    // Unique statuses
    const allowedStatuses = Array.from(
        new Map(transitions.map(t => [t.toStatus.id, t.toStatus])).values()
    );

    return successResponse(allowedStatuses);
});
