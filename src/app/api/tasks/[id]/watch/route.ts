import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/tasks/[id]/watch - Toggle watch status for current user
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;

        // Check if watching
        const existing = await prisma.watcher.findFirst({
            where: { taskId: id, userId: session.user.id },
        });

        if (existing) {
            // Unwatch
            await prisma.watcher.delete({ where: { id: existing.id } });
            return successResponse({ watching: false, message: 'Đã hủy theo dõi' });
        } else {
            // Watch
            // Verify access first
            const task = await prisma.task.findUnique({
                where: { id },
                select: { projectId: true }
            });
            if (!task) return errorResponse('Task không tồn tại', 404);

            const canAccess = session.user.isAdministrator || await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: task.projectId }
            });

            if (!canAccess) return errorResponse('Không có quyền truy cập task này', 403);

            await prisma.watcher.create({
                data: { taskId: id, userId: session.user.id },
            });
            return successResponse({ watching: true, message: 'Đã theo dõi' });
        }
    } catch (error) {
        return handleApiError(error);
    }
}
