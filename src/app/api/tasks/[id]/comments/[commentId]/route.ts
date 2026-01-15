import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateCommentSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string; commentId: string }>;
}

// PUT /api/tasks/[id]/comments/[commentId] - Chỉnh sửa comment
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id, commentId } = await params;
        const body = await req.json();

        // Validate
        const validatedData = updateCommentSchema.parse(body);

        // Check comment exists
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, userId: true, taskId: true },
        });

        if (!comment) {
            return errorResponse('Comment không tồn tại', 404);
        }

        // Check comment belongs to this task
        if (comment.taskId !== id) {
            return errorResponse('Comment không thuộc task này', 400);
        }

        // Only the owner can edit their own comment
        if (comment.userId !== session.user.id) {
            return errorResponse('Bạn chỉ có thể chỉnh sửa comment của mình', 403);
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
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/tasks/[id]/comments/[commentId] - Xóa comment
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id, commentId } = await params;

        // Check comment exists
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, userId: true, taskId: true },
        });

        if (!comment) {
            return errorResponse('Comment không tồn tại', 404);
        }

        // Check comment belongs to this task
        if (comment.taskId !== id) {
            return errorResponse('Comment không thuộc task này', 400);
        }

        // Only the owner can delete their own comment
        if (comment.userId !== session.user.id) {
            return errorResponse('Bạn chỉ có thể xóa comment của mình', 403);
        }

        // Delete comment
        await prisma.comment.delete({
            where: { id: commentId },
        });

        return successResponse({ message: 'Đã xóa comment' });
    } catch (error) {
        return handleApiError(error);
    }
}
