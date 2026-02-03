import prisma from '@/lib/prisma';

// Notification types
export type NotificationType =
    | 'task_assigned'
    | 'task_updated'
    | 'task_status_changed'
    | 'task_comment_added'
    | 'task_mentioned'
    | 'task_due_soon'
    | 'project_member_added'
    | 'project_member_removed';

interface NotificationData {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    metadata?: {
        taskId?: string;
        projectId?: string;
        commentId?: string;
        [key: string]: string | undefined;
    };
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: NotificationData) {
    return prisma.notification.create({
        data: {
            type: data.type,
            title: data.title,
            message: data.message,
            userId: data.userId,
            metadata: data.metadata ?? undefined,
        },
    });
}

/**
 * Create notifications for multiple users
 */
export async function createNotifications(notifications: NotificationData[]) {
    return prisma.notification.createMany({
        data: notifications.map((n) => ({
            type: n.type,
            title: n.title,
            message: n.message,
            userId: n.userId,
            metadata: n.metadata ?? undefined,
        })),
    });
}

/**
 * Notify all watchers of a task (excluding the actor)
 */
export async function notifyTaskWatchers(
    taskId: string,
    actorId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, string | undefined> = {}
) {
    // Get all watchers except the actor

    const watchers = await prisma.watcher.findMany({
        where: {
            taskId,
            userId: { not: actorId },
        },
        select: { userId: true },
    });

    // Also get assignee
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assigneeId: true, creatorId: true },
    });

    // Collect unique user IDs to notify
    const userIds = new Set<string>();
    watchers.forEach((w) => userIds.add(w.userId));
    if (task?.assigneeId && task.assigneeId !== actorId) {
        userIds.add(task.assigneeId);
    }
    if (task?.creatorId && task.creatorId !== actorId) {
        userIds.add(task.creatorId);
    }

    if (userIds.size === 0) return;

    return createNotifications(
        Array.from(userIds).map((userId) => ({
            type,
            title,
            message,
            userId,
            metadata: { taskId, ...metadata },
        }))

    );
}

/**
 * Notify when task is assigned to a user
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
 * Notify when task status changes
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
 * Notify when a comment is added
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

