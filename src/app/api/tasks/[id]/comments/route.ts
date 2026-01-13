import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createCommentSchema } from '@/lib/validations';
import { notifyCommentAdded } from '@/lib/notifications';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/tasks/[id]/comments - Lấy comments của task
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

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
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/tasks/[id]/comments - Thêm comment
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;
        const body = await req.json();

        // Validate
        const validatedData = createCommentSchema.parse({ ...body, taskId: id });

        // Check task exists and user has access
        const task = await prisma.task.findUnique({
            where: { id },
            select: { projectId: true, title: true },
        });

        if (!task) {
            return errorResponse('Task không tồn tại', 404);
        }

        // Check access
        const canAccess =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: task.projectId },
            }));

        if (!canAccess) {
            return errorResponse('Không có quyền bình luận', 403);
        }

        const comment = await prisma.comment.create({
            data: {
                content: validatedData.content,
                taskId: id,
                userId: session.user.id,
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
            session.user.id,
            session.user.name || 'Ai đó',
            validatedData.content,
            comment.id
        );

        return successResponse(comment, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
