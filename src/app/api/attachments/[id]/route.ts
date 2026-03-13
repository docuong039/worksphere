import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { AttachmentServerService } from '@/server/services/attachment.server';

// DELETE /api/attachments/[id] - Xóa attachment
export const DELETE = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        await AttachmentServerService.deleteAttachment(user, id);
        return successResponse({ message: 'Đã xóa file' });
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('tồn tại') || error.message.includes('tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});
