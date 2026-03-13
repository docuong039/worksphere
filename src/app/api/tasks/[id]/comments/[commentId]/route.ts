import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { CommentServerService } from '@/server/services/comment.server';

// PUT /api/tasks/[id]/comments/[commentId] - Chỉnh sửa comment
export const PUT = withAuth(async (req, user, ctx) => {
    try {
        const { id, commentId } = await (ctx as RouteContext<{ id: string; commentId: string }>).params;
        const body = await req.json();

        const updatedComment = await CommentServerService.updateComment(user, id, commentId, body);
        return successResponse(updatedComment);
    } catch (error: any) {
        const isNotFound = error.message.includes('không tồn tại');
        const isForbidden = error.message.includes('quyền') || error.message.includes('thuộc công việc');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});

// DELETE /api/tasks/[id]/comments/[commentId] - Xóa comment
export const DELETE = withAuth(async (_req, user, ctx) => {
    try {
        const { id, commentId } = await (ctx as RouteContext<{ id: string; commentId: string }>).params;
        await CommentServerService.deleteComment(user, id, commentId);
        return successResponse({ message: 'Đã xóa comment' });
    } catch (error: any) {
        const isNotFound = error.message.includes('không tồn tại');
        const isForbidden = error.message.includes('quyền') || error.message.includes('thuộc công việc');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});
