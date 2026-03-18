import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sseManager } from '@/lib/sse';

// Bắt buộc API này luôn dynamict để không bị cache
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Xác thực request chỉ được gọi bởi Vercel Cron (Mã bảo mật CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Tạm trả về Unauthorized nếu không khớp mã. Nếu test ở localhost, bạn phải bỏ cờ này hoặc test truyền đúng Header.
        return new NextResponse('Unauthorized: Invalid CRON_SECRET', { status: 401 });
    }

    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

        // 1. Lấy danh sách task chưa đóng, có ngày đến hạn, và có người nhận
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

        // 2. Lấy thông báo đã tạo hôm nay để tránh spam ngập lụt 1 ngày nhiều tin
        const recentNotifications = await prisma.notification.findMany({
            where: {
                type: { in: ['TASK_DUE_SOON', 'TASK_OVERDUE'] },
                createdAt: { gte: startOfToday }
            },
            select: { metadata: true, type: true }
        });

        const notifiedTaskIds = new Set<string>();
        for (const notif of recentNotifications) {
            if (notif.metadata) {
                try {
                    const parsed = JSON.parse(notif.metadata);
                    if (parsed.taskId) notifiedTaskIds.add(`${parsed.taskId}-${notif.type}`);
                } catch {
                    // Ignore parse error
                }
            }
        }

        const notificationsToCreate = [];

        // 3. Xử lý kịch bản phân loại:
        for (const task of activeTasks) {
            const dueDate = task.dueDate!;
            let notifType: string | null = null;
            let messageTitle = '';
            let messageBody = '';

            // So sánh thời điểm đầu ngày của task để dễ tính toán
            const taskDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

            if (taskDueDate < startOfToday) {
                notifType = 'TASK_OVERDUE';
                messageTitle = 'Công việc quá hạn';
                messageBody = `Cảnh báo: Công việc "${task.title}" đã quá hạn. Vui lòng cập nhật tiến độ công việc!`;
            } else if (taskDueDate.getTime() === startOfToday.getTime() || taskDueDate.getTime() === startOfTomorrow.getTime()) {
                notifType = 'TASK_DUE_SOON';
                messageTitle = 'Công việc sắp đến hạn';
                messageBody = `Lưu ý: Công việc "${task.title}" sắp đến hạn. Hãy chú ý hoàn thành đúng hạn!`;
            }

            if (notifType && task.assigneeId) {
                const key = `${task.id}-${notifType}`;
                if (!notifiedTaskIds.has(key)) {
                    // Thêm vào hàng đợi gửi
                    const metadataObj = { taskId: task.id, projectId: task.projectId };
                    notificationsToCreate.push({
                        userId: task.assigneeId,
                        type: notifType,
                        title: messageTitle,
                        message: messageBody,
                        metadata: JSON.stringify(metadataObj),
                    });
                }
            }
        }

        // 4. Ta tạo thông báo trong database và push SSE real-time
        let sentCount = 0;
        for (const input of notificationsToCreate) {
            const notif = await prisma.notification.create({
                data: input
            });
            sentCount++;

            // Push real-time event cho phiên làm việc nào đang mở tab mạng (SSE)
            sseManager.emit(input.userId, 'notification', {
                id: notif.id,
                title: notif.title,
                message: notif.message,
                read: false,
                createdAt: notif.createdAt,
                type: notif.type,
                href: `/tasks/${JSON.parse(input.metadata).taskId}`,
                metadata: notif.metadata
            });
        }

        return NextResponse.json({
            success: true,
            sentCount,
            message: `Auto-reminder cronjob completed successfully! Sent ${sentCount} notices.`
        });

    } catch (error) {
        console.error('Daily reminder cron error:', error);
        return new NextResponse(error instanceof Error ? error.message : 'Hệ thống gặp lỗi lúc quét', { status: 500 });
    }
}

/*
 * =========================================================================
 * GIẢI THÍCH LOGIC TÍNH TOÁN "SẮP ĐẾN HẠN" LÀ NHƯ THẾ NÀO?
 * =========================================================================
 * 
 * Vấn đề: Tránh việc tính lệch giờ (ví dụ deadline set lúc 23h, nhưng lúc 8h sáng check lại bị sai).
 * Giải pháp: Đưa toàn bộ mốc thời gian so sánh về 00:00:00 của ngày đỏ.
 * 
 * Mốc thời gian hệ thống dùng:
 * 1. startOfToday:    00:00:00 của ngày Hôm nay.
 * 2. startOfTomorrow: 00:00:00 của ngày Hôm sau (Ngày mai).
 * 3. taskDueDate:     00:00:00 của ngày dueDate trên Database của task đó.
 * 
 * Logic So sánh (Giả sử Hôm nay là 20/05, lúc 8:00 Sáng):
 * 
 * - QUÁ HẠN (TASK_OVERDUE): 
 *   Nếu taskDueDate < startOfToday (tức là dueDate nằm ở ngày 19/05 về trước). 
 *   => Vì đã qua ngày 20/05 nên chắc chắn đã nhỡ hẹn. Gửi cảnh báo Quá Hạn.
 * 
 * - SẮP ĐẾN HẠN (TASK_DUE_SOON): 
 *   Nếu taskDueDate == startOfToday (tức là dueDate đúng ngày hôm nay 20/05).
 *   Hoặc taskDueDate == startOfTomorrow (tức là dueDate đúng vào ngày mai 21/05).
 *   => Thời gian chỉ còn <= 48 giờ. Gửi cảnh báo Sắp Đến Hạn.
 * 
 * Còn các dueDate xa hơn như 22/05, 23/05 => Hệ thống sẽ bỏ qua, không gửi spam thông báo làm phiền nhân sự.
 * 
 * =========================================================================
 * CƠ CHẾ CHỐNG SPAM
 * =========================================================================
 * - Hệ thống sẽ quét bảng Notification để tìm xem [taskId] + [loại cảnh báo] đã được nhắc lệnh trong ngày hôm nay chưa (Kể từ startOfToday).
 * - Mọi thông báo nhắc nhở đã từng bắn trong ngày hôm nay sẽ được gộp vào 1 cục bộ nhớ tên `notifiedTaskIds`.
 * - Nếu phát hiện Task A định gửi mà đã nằm trong cục `notifiedTaskIds` => BỎ QUA không gửi.
 * - Điều này giúp CronJob dù có chạy lại 100 lần vào ngày hôm đó thì cũng không bơm hàng trăm thông báo rác vào mặt user. Nó chỉ réo lại sau khi bước sang 00:00:00 của ngày kế tiếp.
 */
