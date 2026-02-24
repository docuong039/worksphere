import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { unlink } from 'fs/promises';
import path from 'path';
import { getUserPermissions } from '@/lib/permissions';
import * as AttachmentPolicy from '@/modules/attachment/attachment.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';


// DELETE /api/attachments/[id] - Xóa attachment
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: { task: { select: { projectId: true } } },
    });

    if (!attachment) return errorResponse('File không tồn tại', 404);

    // Authorization Policy check
    const projectId = attachment.task?.projectId;
    const userPermissions = projectId ? await getUserPermissions(user.id, projectId) : [];
    const canDelete = AttachmentPolicy.canDeleteAttachment(user, attachment, userPermissions);

    if (!canDelete) {
        return errorResponse('Không có quyền xóa tệp đính kèm này', 403);
    }


    // Delete record
    await prisma.attachment.delete({ where: { id } });

    // Delete file from disk
    const filepath = path.join(process.cwd(), 'public', attachment.path);
    try {
        await unlink(filepath);
    } catch (e) {
        console.error('Failed to delete file from disk:', e);
        // Continue even if file delete fails (maybe already gone)
    }

    return successResponse({ message: 'Đã xóa file' });
});
