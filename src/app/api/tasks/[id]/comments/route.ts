import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { CommentServerService } from '@/server/services/comment.server';

// GET /api/tasks/[id]/comments - Lấy comments của task
export const GET = withAuth(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const comments = await CommentServerService.getComments(id);
        return successResponse(comments);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
});

// POST /api/tasks/[id]/comments - Thêm comment
export const POST = withAuth(async (req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const comment = await CommentServerService.createComment(user, id, body);
        return successResponse(comment, 201);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền') || error.message.includes('truy cập');
        const isNotFound = error.message.includes('không tồn tại');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});
