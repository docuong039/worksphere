import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';

// GET /api/notifications - Lấy thông báo của user hiện tại
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = {
        userId: user.id,
        ...(unreadOnly && { isRead: false }),
    };

    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        }),
        prisma.notification.count({
            where: { userId: user.id, isRead: false },
        }),
    ]);

    return successResponse({
        notifications,
        unreadCount,
    });
});

// PUT /api/notifications - Đánh dấu đã đọc
export const PUT = withAuth(async (req, user) => {
    const body = await req.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
        // Mark all as read
        await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true },
        });
    } else if (notificationIds && Array.isArray(notificationIds)) {
        // Mark specific notifications as read
        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: user.id,
            },
            data: { isRead: true },
        });
    }

    return successResponse({ message: 'Đã cập nhật' });
});
