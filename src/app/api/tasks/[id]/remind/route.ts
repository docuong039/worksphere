import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import prisma from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';
import { sseManager } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                assignee: true,
            }
        });

        if (!task) return errorResponse('Công việc không tồn tại', 404);

        if (!task.assigneeId) {
            return errorResponse('Công việc này chưa được gán cho ai để nhắc', 400);
        }

        // Kiểm tra quyền remind
        let canRemind = user.isAdministrator;
        if (!canRemind) {
            const permissions = await getUserPermissions(user.id, task.projectId);
            canRemind = permissions.includes(PERMISSIONS.TASKS.REMIND);
        }

        if (!canRemind) {
            return errorResponse('Bạn không có quyền nhắc việc trong dự án này', 403);
        }

        // Tạo thông báo nhắc việc
        const notification = await prisma.notification.create({
            data: {
                userId: task.assigneeId,
                type: 'TASK_REMINDER',
                title: 'Nhắc nhở công việc',
                message: `Bạn được nhắc nhở sớm hoàn thành công việc: ${task.title}`,
                metadata: JSON.stringify({ taskId: task.id, projectId: task.projectId }),
            }
        });

        // Push SSE notification
        sseManager.emit(task.assigneeId, 'notification', {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            read: false,
            createdAt: notification.createdAt,
            type: notification.type,
            href: `/tasks/${task.id}`,
            metadata: notification.metadata // Parse string on client logic
        });

        return successResponse({ message: 'Đã gửi nhắc việc' });
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
