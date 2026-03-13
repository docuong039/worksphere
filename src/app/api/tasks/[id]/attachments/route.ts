import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { AttachmentServerService } from '@/server/services/attachment.server';

// POST /api/tasks/[id]/attachments - Upload attachment
export const POST = withAuth(async (req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const formData = await req.formData();
        
        const attachment = await AttachmentServerService.createAttachment(user, id, formData);
        return successResponse(attachment, 201);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('tồn tại') || error.message.includes('tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});
