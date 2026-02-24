/**
 * @file notifications.ts
 * @description Quản lý hệ thống thông báo trong ứng dụng.
 * Gửi thông báo tới tất cả người liên quan khi có sự kiện quan trọng.
 * Quy tắc: Gửi cho Assignee, Creator và những người đang theo dõi (Watchers), ngoại trừ người thực hiện hành động.
 *
 * Realtime: Sau khi lưu vào DB, notification được push ngay tới user qua SSE
 * (nếu user đang online). Nếu offline → dữ liệu vẫn trong DB, client sẽ
 * nhận khi poll lần tiếp theo hoặc khi reconnect SSE.
 */
import prisma from '@/lib/prisma';
import { sseManager } from '@/lib/sse';

// Notification types
export type NotificationType =
    | 'task_assigned'
    | 'task_updated'
    | 'task_status_changed'
    | 'task_comment_added'
    | 'task_mentioned'
    | 'task_due_soon'
    | 'project_created'
    | 'project_member_added'
    | 'project_member_removed';

interface NotificationData {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    metadata?: Record<string, string | undefined>;
}

/**
 * Serialize metadata object to JSON string (Prisma stores it as String? in DB)
 */
function serializeMetadata(metadata?: Record<string, string | undefined>): string | undefined {
    if (!metadata) return undefined;
    // Remove undefined values before stringifying
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
        if (value !== undefined) cleaned[key] = value;
    }
    return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : undefined;
}

/**
 * Tạo 1 thông báo duy nhất và push realtime qua SSE (nếu user đang online).
 */
export async function createNotification(data: NotificationData) {
    const notification = await prisma.notification.create({
        data: {
            type: data.type,
            title: data.title,
            message: data.message,
            userId: data.userId,
            metadata: serializeMetadata(data.metadata),
        },
    });

    // Push realtime (best-effort — không throw nếu user offline)
    sseManager.emit(data.userId, 'notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        metadata: data.metadata ?? null,
        createdAt: notification.createdAt.toISOString(),
    });

    return notification;
}

/**
 * Tạo nhiều thông báo cùng lúc (Bulk create) và push realtime cho từng user.
 */
export async function createNotifications(notifications: NotificationData[]) {
    if (notifications.length === 0) return;

    // createMany không trả về records → dùng createManyAndReturn nếu Prisma >= 5.14
    // Fallback: tạo tuần tự để lấy id + push SSE từng cái
    // Dùng Promise.all để song song hoá
    const results = await Promise.all(
        notifications.map((n) =>
            prisma.notification.create({
                data: {
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    userId: n.userId,
                    metadata: serializeMetadata(n.metadata),
                },
            })
        )
    );

    // Push realtime cho từng user (best-effort)
    for (let i = 0; i < results.length; i++) {
        const notif = results[i];
        const data = notifications[i];
        sseManager.emit(notif.userId, 'notification', {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            isRead: notif.isRead,
            metadata: data.metadata ?? null,
            createdAt: notif.createdAt.toISOString(),
        });
    }

    return results;
}

/**
 * Thông báo cho tất cả người quan tâm tới task (Watchers + Assignee + Creator)
 * Ngoại trừ người thực hiện hành động (actorId)
 */
export async function notifyTaskWatchers(
    taskId: string,
    actorId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, string | undefined> = {}
) {
    // 1. Lấy danh sách Watchers
    const watchers = await prisma.watcher.findMany({
        where: {
            taskId,
            userId: { not: actorId },
        },
        select: { userId: true },
    });

    // 2. Lấy Assignee và Creator
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assigneeId: true, creatorId: true, projectId: true },
    });

    // 3. Tập hợp các ID duy nhất
    const userIds = new Set<string>();
    watchers.forEach((w) => userIds.add(w.userId));

    if (task?.assigneeId && task.assigneeId !== actorId) {
        userIds.add(task.assigneeId);
    }
    if (task?.creatorId && task.creatorId !== actorId) {
        userIds.add(task.creatorId);
    }

    if (userIds.size === 0) return;

    // 4. Gửi thông báo cho tất cả
    return createNotifications(
        Array.from(userIds).map((userId) => ({
            type,
            title,
            message,
            userId,
            metadata: { taskId, projectId: task?.projectId, ...metadata },
        }))
    );
}

/**
 * Thông báo khi được gán task mới
 */
export async function notifyTaskAssigned(
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    actorName: string
) {
    return createNotification({
        type: 'task_assigned',
        title: 'Bạn được gán công việc mới',
        message: `${actorName} đã gán cho bạn công việc: "${taskTitle}"`,
        userId: assigneeId,
        metadata: { taskId },
    });
}

/**
 * Thông báo khi trạng thái công việc thay đổi
 */
export async function notifyTaskStatusChanged(
    taskId: string,
    taskTitle: string,
    actorId: string,
    actorName: string,
    oldStatus: string,
    newStatus: string
) {
    return notifyTaskWatchers(
        taskId,
        actorId,
        'task_status_changed',
        'Trạng thái công việc đã thay đổi',
        `${actorName} đã chuyển "${taskTitle}" từ ${oldStatus} sang ${newStatus}`
    );
}

/**
 * Thông báo khi có bình luận mới
 */
export async function notifyCommentAdded(
    taskId: string,
    taskTitle: string,
    actorId: string,
    actorName: string,
    commentPreview: string,
    commentId?: string
) {
    return notifyTaskWatchers(
        taskId,
        actorId,
        'task_comment_added',
        'Bình luận mới',
        `${actorName} đã bình luận về "${taskTitle}": "${commentPreview.substring(0, 100)}${commentPreview.length > 100 ? '...' : ''}"`,
        { commentId }
    );
}

/**
 * Thông báo khi task được cập nhật (các trường khác ngoài status / assignee)
 */
export async function notifyTaskUpdated(
    taskId: string,
    taskTitle: string,
    actorId: string,
    actorName: string
) {
    return notifyTaskWatchers(
        taskId,
        actorId,
        'task_updated',
        'Công việc được cập nhật',
        `${actorName} đã cập nhật công việc "${taskTitle}"`
    );
}

/**
 * Thông báo khi được thêm vào dự án
 */
export async function notifyProjectMemberAdded(
    projectId: string,
    projectName: string,
    targetUserId: string,
    actorName: string
) {
    return createNotification({
        type: 'project_member_added',
        title: 'Bạn được thêm vào dự án',
        message: `${actorName} đã thêm bạn vào dự án "${projectName}"`,
        userId: targetUserId,
        metadata: { projectId },
    });
}

/**
 * Thông báo khi bị xóa khỏi dự án
 */
export async function notifyProjectMemberRemoved(
    projectId: string,
    projectName: string,
    targetUserId: string,
    actorName: string
) {
    return createNotification({
        type: 'project_member_removed',
        title: 'Bạn bị xóa khỏi dự án',
        message: `${actorName} đã xóa bạn khỏi dự án "${projectName}"`,
        userId: targetUserId,
        metadata: { projectId },
    });
}

/**
 * Thông báo khi có dự án mới được tạo.
 * Gửi cho tất cả admin (ngoại trừ người tạo).
 */
export async function notifyProjectCreated(
    projectId: string,
    projectName: string,
    creatorId: string,
    creatorName: string
) {
    // Lấy tất cả admin users (trừ người tạo)
    const admins = await prisma.user.findMany({
        where: {
            isAdministrator: true,
            isActive: true,
            id: { not: creatorId },
        },
        select: { id: true },
    });

    if (admins.length === 0) return;

    return createNotifications(
        admins.map((admin) => ({
            type: 'project_created' as NotificationType,
            title: 'Dự án mới được tạo',
            message: `${creatorName} đã tạo dự án mới "${projectName}"`,
            userId: admin.id,
            metadata: { projectId },
        }))
    );
}
