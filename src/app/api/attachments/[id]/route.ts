import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { unlink } from 'fs/promises';
import path from 'path';

interface Params {
    params: Promise<{ id: string }>;
}

// DELETE /api/attachments/[id] - Xóa attachment
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;

        const attachment = await prisma.attachment.findUnique({
            where: { id },
            include: { task: { select: { projectId: true } } },
        });

        if (!attachment) return errorResponse('File không tồn tại', 404);

        // Permissions: Admin, Author, or Project Manager (simplified: author or admin)
        const isAuthor = attachment.userId === session.user.id;
        if (!session.user.isAdministrator && !isAuthor) {
            // Check project strict permission if needed, but for now stick to simplified
            return errorResponse('Không có quyền xóa file này', 403);
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
    } catch (error) {
        return handleApiError(error);
    }
}
