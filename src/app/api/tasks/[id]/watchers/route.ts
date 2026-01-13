import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/tasks/[id]/watchers - Lấy danh sách watchers
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;

        const watchers = await prisma.watcher.findMany({
            where: { taskId: id },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Check if current user is watching
        const isWatching = watchers.some((w) => w.userId === session.user.id);

        return successResponse({
            watchers,
            isWatching,
            count: watchers.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/tasks/[id]/watchers - Thêm watcher
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;
        const body = await req.json();
        // userId optional - nếu không có thì tự watch mình
        const targetUserId = body.userId || session.user.id;

        // Check task exists
        const task = await prisma.task.findUnique({
            where: { id },
            select: { projectId: true, creatorId: true, assigneeId: true },
        });
        if (!task) return errorResponse('Task không tồn tại', 404);

        // Check permission
        const isSelfWatch = targetUserId === session.user.id;
        const canAddOthers =
            session.user.isAdministrator ||
            task.creatorId === session.user.id ||
            task.assigneeId === session.user.id ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: task.projectId },
            }));

        if (!isSelfWatch && !canAddOthers) {
            return errorResponse('Không có quyền thêm người theo dõi', 403);
        }

        // Check if target is project member
        const isMember = await prisma.projectMember.findFirst({
            where: { userId: targetUserId, projectId: task.projectId },
        });
        if (!isMember && !session.user.isAdministrator) {
            return errorResponse('Người dùng này không phải thành viên dự án', 400);
        }

        const watcher = await prisma.watcher.create({
            data: {
                taskId: id,
                userId: targetUserId,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true, email: true } },
            },
        });

        return successResponse(watcher, 201);
    } catch (error) {
        if ((error as { code?: string }).code === 'P2002') {
            return errorResponse('Người dùng này đang theo dõi task rồi', 409);
        }
        return handleApiError(error);
    }
}

// DELETE /api/tasks/[id]/watchers - Xóa watcher (unwatch)
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get('userId') || session.user.id;

        // Check task exists
        const task = await prisma.task.findUnique({
            where: { id },
            select: { creatorId: true, assigneeId: true },
        });
        if (!task) return errorResponse('Task không tồn tại', 404);

        // Check permission: self-unwatch always allowed
        const isSelfUnwatch = targetUserId === session.user.id;
        const canRemoveOthers =
            session.user.isAdministrator ||
            task.creatorId === session.user.id ||
            task.assigneeId === session.user.id;

        if (!isSelfUnwatch && !canRemoveOthers) {
            return errorResponse('Không có quyền xóa người theo dõi', 403);
        }

        // Find and delete watcher
        const watcher = await prisma.watcher.findFirst({
            where: { taskId: id, userId: targetUserId },
        });

        if (!watcher) {
            return errorResponse('Người dùng này không theo dõi task', 404);
        }

        await prisma.watcher.delete({
            where: { id: watcher.id },
        });

        return successResponse({ message: 'Đã xóa khỏi danh sách theo dõi' });
    } catch (error) {
        return handleApiError(error);
    }
}

