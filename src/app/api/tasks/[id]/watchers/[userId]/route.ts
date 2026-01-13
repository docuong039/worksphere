import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string; userId: string }>;
}

// DELETE /api/tasks/[id]/watchers/[userId] - Xóa watcher
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id, userId } = await params;

        // Check permissions
        // 1. Admin removes anyone
        // 2. User removes themselves
        // 3. Project Member can remove others? (Redmine: usually yes if they have permission)

        let canRemove = false;
        if (session.user.isAdministrator || session.user.id === userId) {
            canRemove = true;
        } else {
            const task = await prisma.task.findUnique({
                where: { id },
                select: { projectId: true },
            });
            if (task) {
                const membership = await prisma.projectMember.findFirst({
                    where: { userId: session.user.id, projectId: task.projectId }
                });
                // Basic permission: if member, allowed to manage watchers (simplified)
                if (membership) canRemove = true;
            }
        }

        if (!canRemove) return errorResponse('Không có quyền xóa người theo dõi này', 403);

        await prisma.watcher.deleteMany({
            where: {
                taskId: id,
                userId: userId,
            },
        });

        return successResponse({ message: 'Đã xóa người theo dõi' });
    } catch (error) {
        return handleApiError(error);
    }
}
