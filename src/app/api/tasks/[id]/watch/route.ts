import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';


// POST /api/tasks/[id]/watch - Toggle watch status for current user
export const POST = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Check if watching
    const existing = await prisma.watcher.findFirst({
        where: { taskId: id, userId: user.id },
    });

    if (existing) {
        // Unwatch
        await prisma.watcher.delete({ where: { id: existing.id } });
        return successResponse({ watching: false, message: 'Đã hủy theo dõi' });
    } else {
        // Watch
        // Verify access first
        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true }
        });
        if (!task) return errorResponse('Task không tồn tại', 404);

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canView = TaskPolicy.canViewTask(user, task, userPermissions);

        if (!canView) return errorResponse('Không có quyền truy cập task này', 403);


        await prisma.watcher.create({
            data: { taskId: id, userId: user.id },
        });
        return successResponse({ watching: true, message: 'Đã theo dõi' });
    }
});
