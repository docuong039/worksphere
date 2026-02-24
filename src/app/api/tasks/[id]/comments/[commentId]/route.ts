import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { updateCommentSchema } from '@/lib/validations';
import { getUserPermissions } from '@/lib/permissions';
import * as CommentPolicy from '@/modules/comment/comment.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';


// PUT /api/tasks/[id]/comments/[commentId] - Chỉnh sửa comment
export const PUT = withAuth(async (req, user, ctx) => {
    const { id, commentId } = await (ctx as RouteContext<{ id: string; commentId: string }>).params;
    const body = await req.json();

    // Validate
    const validatedData = updateCommentSchema.parse(body);

    // Check comment exists
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true, taskId: true },
    });

    if (!comment) {
        return errorResponse('Bình luận không tồn tại', 404);
    }

    // Check comment belongs to this task and get project info
    const task = await prisma.task.findUnique({
        where: { id },
        select: { projectId: true }
    });

    if (!task || comment.taskId !== id) {
        return errorResponse('Bình luận không thuộc công việc này', 400);
    }

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canEdit = CommentPolicy.canUpdateComment(user, comment, userPermissions);

    if (!canEdit) {
        return errorResponse('Không có quyền chỉnh sửa bình luận này', 403);
    }


    // Update comment
    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
            content: validatedData.content,
            updatedAt: new Date(),
        },
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
        },
    });

    return successResponse(updatedComment);
});

// DELETE /api/tasks/[id]/comments/[commentId] - Xóa comment
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id, commentId } = await (ctx as RouteContext<{ id: string; commentId: string }>).params;

    // Check comment exists
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true, taskId: true },
    });

    if (!comment) {
        return errorResponse('Bình luận không tồn tại', 404);
    }

    // Check comment belongs to this task
    const task = await prisma.task.findUnique({
        where: { id },
        select: { projectId: true }
    });

    if (!task || comment.taskId !== id) {
        return errorResponse('Bình luận không thuộc công việc này', 400);
    }

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canDelete = CommentPolicy.canDeleteComment(user, comment, userPermissions);

    if (!canDelete) {
        return errorResponse('Không có quyền xóa bình luận này', 403);
    }


    // Delete comment
    await prisma.comment.delete({
        where: { id: commentId },
    });

    return successResponse({ message: 'Đã xóa comment' });
});
