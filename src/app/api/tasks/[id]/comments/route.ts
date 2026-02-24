import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { createCommentSchema } from '@/lib/validations';
import { notifyCommentAdded } from '@/lib/notifications';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';
import * as TaskPolicy from '@/modules/task/task.policy';
import * as CommentPolicy from '@/modules/comment/comment.policy';


// GET /api/tasks/[id]/comments - Lấy comments của task
export const GET = withAuth(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const comments = await prisma.comment.findMany({
        where: { taskId: id },
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return successResponse(comments);
});

// POST /api/tasks/[id]/comments - Thêm comment
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();

    // Validate
    const validatedData = createCommentSchema.parse({ ...body, taskId: id });

    // Check task exists and Authorization Policy
    const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, projectId: true, title: true, creatorId: true, assigneeId: true, isPrivate: true },
    });

    if (!task) {
        return errorResponse('Công việc không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, task.projectId);

    // Check if user can even see the task (ABAC)
    if (!TaskPolicy.canViewTask(user, task, userPermissions)) {
        return errorResponse('Không có quyền truy cập công việc này', 403);
    }

    // Check if user can comment (RBAC part encapsulated in Policy)
    if (!CommentPolicy.canCreateComment(user, userPermissions)) {
        return errorResponse('Bạn không có quyền bình luận trong dự án này', 403);
    }



    const comment = await prisma.comment.create({
        data: {
            content: validatedData.content,
            taskId: id,
            userId: user.id,
        },
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
        },
    });

    // Update task updatedAt
    await prisma.task.update({
        where: { id },
        data: { updatedAt: new Date() },
    });

    // Send notification to watchers (async)
    notifyCommentAdded(
        id,
        task.title,
        user.id,
        user.name || 'Ai đó',
        validatedData.content,
        comment.id
    );

    return successResponse(comment, 201);
});
