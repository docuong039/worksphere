import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/notifications - Lấy thông báo của user hiện tại
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = {
            userId: session.user.id,
            ...(unreadOnly && { isRead: false }),
        };

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.notification.count({
                where: { userId: session.user.id, isRead: false },
            }),
        ]);

        return successResponse({
            notifications,
            unreadCount,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/notifications - Đánh dấu đã đọc
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const body = await req.json();
        const { notificationIds, markAll } = body;

        if (markAll) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId: session.user.id, isRead: false },
                data: { isRead: true },
            });
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id,
                },
                data: { isRead: true },
            });
        }

        return successResponse({ message: 'Đã cập nhật' });
    } catch (error) {
        return handleApiError(error);
    }
}
