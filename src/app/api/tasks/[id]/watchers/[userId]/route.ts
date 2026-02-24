import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';
import { PERMISSIONS } from '@/lib/constants';


// DELETE /api/tasks/[id]/watchers/[userId] - Xóa watcher
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id, userId } = await (ctx as RouteContext<{ id: string; userId: string }>).params;

    // Check permissions
    // 1. Admin removes anyone
    // 2. User removes themselves
    // 3. Project Member can remove others? (Redmine: usually yes if they have permission)

    let canRemove = false;
    if (user.isAdministrator || user.id === userId) {
        canRemove = true;
    } else {
        // Removing others requires explicit manage_watchers permission
        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, creatorId: true, assigneeId: true, projectId: true, isPrivate: true },
        });

        if (task) {
            const userPermissions = await getUserPermissions(user.id, task.projectId);
            canRemove = TaskPolicy.canManageWatchers(user, task, userPermissions);
        }
    }


    if (!canRemove) return errorResponse('Không có quyền xóa người theo dõi này', 403);

    await prisma.watcher.deleteMany({
        where: {
            taskId: id,
            userId: userId,
        },
    });

    return successResponse({ message: 'Đã xóa người theo dõi' });
});
