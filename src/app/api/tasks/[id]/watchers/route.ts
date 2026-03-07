import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';
import { PERMISSIONS } from '@/lib/constants';
import { notifyWatcherAdded } from '@/lib/notifications';


// GET /api/tasks/[id]/watchers - Lấy danh sách watchers
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const watchers = await prisma.watcher.findMany({
        where: { taskId: id },
        include: {
            user: {
                select: { id: true, name: true, avatar: true, email: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Check if current user is watching
    const isWatching = watchers.some((w) => w.userId === user.id);

    return successResponse({
        watchers,
        isWatching,
        count: watchers.length,
    });
});

// POST /api/tasks/[id]/watchers - Thêm watcher
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    // userId optional - nếu không có thì tự watch mình
    const targetUserId = body.userId || user.id;

    // Check task exists
    const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, projectId: true, creatorId: true, assigneeId: true, isPrivate: true, title: true },
    });

    if (!task) return errorResponse('Task không tồn tại', 404);

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canView = TaskPolicy.canViewTask(user, task, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập công việc này', 403);
    }

    // Check permission: target is self or has manage permission
    const isSelfWatch = targetUserId === user.id;
    const canManage = TaskPolicy.canManageWatchers(user, task, userPermissions);

    if (!isSelfWatch && !canManage) {
        return errorResponse('Không có quyền thêm người theo dõi cho công việc này', 403);
    }


    // Check if target is project member
    const isMember = await prisma.projectMember.findFirst({
        where: { userId: targetUserId, projectId: task.projectId },
    });
    if (!isMember && !user.isAdministrator) {
        return errorResponse('Người dùng này không phải thành viên dự án', 400);
    }

    try {
        const watcher = await prisma.watcher.create({
            data: {
                taskId: id,
                userId: targetUserId,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true, email: true } },
            },
        });

        if (!isSelfWatch) {
            // Non-blocking notification
            notifyWatcherAdded(id, task.title, targetUserId, user.name).catch(e => {
                console.error('Failed to send watcher added notification:', e);
            });
        }

        return successResponse(watcher, 201);
    } catch (error) {
        if ((error as { code?: string }).code === 'P2002') {
            return errorResponse('Người dùng này đang theo dõi task rồi', 409);
        }
        return handleApiError(error);
    }
});

// DELETE /api/tasks/[id]/watchers - Xóa watcher (unwatch)
export const DELETE = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || user.id;

    // Check task exists
    const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, projectId: true, creatorId: true, assigneeId: true, isPrivate: true },
    });

    if (!task) return errorResponse('Công việc không tồn tại', 404);

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canView = TaskPolicy.canViewTask(user, task, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập công việc này', 403);
    }

    // Check permission: self-unwatch always allowed, otherwise need manage permission
    const isSelfUnwatch = targetUserId === user.id;
    const canManage = TaskPolicy.canManageWatchers(user, task, userPermissions);

    if (!isSelfUnwatch && !canManage) {
        return errorResponse('Không có quyền xóa người theo dõi', 403);
    }


    // Find and delete watcher
    const watcher = await prisma.watcher.findFirst({
        where: { taskId: id, userId: targetUserId },
    });

    if (!watcher) {
        return errorResponse('Người dùng này không theo dõi task', 404);
    }

    await prisma.watcher.delete({
        where: { id: watcher.id },
    });

    return successResponse({ message: 'Đã xóa khỏi danh sách theo dõi' });
});
