/**
 * [DEMO ONLY] POST /api/cron/demo-fire
 *
 * Dùng để demo/test: Xoá thông báo tự động đã gửi hôm nay (reset anti-spam)
 * rồi bắn lại ngay lập tức. KHÔNG dùng trong production.
 *
 * Gọi: curl.exe -H "Authorization: Bearer <CRON_SECRET>" -X POST http://localhost:3000/api/cron/demo-fire
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sseManager } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

        // Bước 1: Xoá thông báo tự động đã gửi hôm nay để reset anti-spam
        const deleted = await prisma.notification.deleteMany({
            where: {
                type: { in: ['TASK_DUE_SOON', 'TASK_OVERDUE'] },
                createdAt: { gte: startOfToday }
            }
        });

        // Bước 2: Lấy task chưa đóng, có người nhận, có deadline
        const activeTasks = await prisma.task.findMany({
            where: {
                status: { isClosed: false },
                assigneeId: { not: null },
                dueDate: { not: null }
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                assigneeId: true,
                projectId: true
            }
        });

        const notificationsToCreate = [];

        // Bước 3: Phân loại và tạo danh sách thông báo
        for (const task of activeTasks) {
            const dueDate = task.dueDate!;
            const taskDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

            let notifType: string | null = null;
            let messageTitle = '';
            let messageBody = '';

            if (taskDueDate < startOfToday) {
                notifType = 'TASK_OVERDUE';
                messageTitle = 'Công việc quá hạn';
                messageBody = `Cảnh báo: Công việc "${task.title}" đã quá hạn. Vui lòng cập nhật tiến độ!`;
            } else if (
                taskDueDate.getTime() === startOfToday.getTime() ||
                taskDueDate.getTime() === startOfTomorrow.getTime()
            ) {
                notifType = 'TASK_DUE_SOON';
                messageTitle = 'Công việc sắp đến hạn';
                messageBody = `Lưu ý: Công việc "${task.title}" sắp đến hạn. Hãy hoàn thành đúng hạn!`;
            }

            if (notifType && task.assigneeId) {
                notificationsToCreate.push({
                    userId: task.assigneeId,
                    type: notifType,
                    title: messageTitle,
                    message: messageBody,
                    metadata: JSON.stringify({ taskId: task.id, projectId: task.projectId }),
                });
            }
        }

        // Bước 4: Lưu DB và push SSE realtime
        let sentCount = 0;
        for (const input of notificationsToCreate) {
            const notif = await prisma.notification.create({ data: input });
            sentCount++;

            sseManager.emit(input.userId, 'notification', {
                id: notif.id,
                title: notif.title,
                message: notif.message,
                isRead: false,
                createdAt: notif.createdAt.toISOString(),
                type: notif.type,
                metadata: notif.metadata,
            });
        }

        return NextResponse.json({
            success: true,
            deletedToday: deleted.count,
            sentCount,
            message: `[DEMO] Đã reset ${deleted.count} thông báo cũ và gửi lại ${sentCount} thông báo mới.`
        });

    } catch (error) {
        console.error('[demo-fire] Error:', error);
        return new NextResponse(error instanceof Error ? error.message : 'Lỗi hệ thống', { status: 500 });
    }
}
