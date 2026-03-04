import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';
import * as TaskPolicy from '@/modules/task/task.policy';


// POST /api/tasks/[id]/copy - Copy a task
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    const {
        targetProjectId,
        copySubtasks,
        copyWatchers,
    } = body;

    // Get original task
    const originalTask = await prisma.task.findUnique({
        where: { id },
        include: {
            subtasks: true,
            watchers: true,
            attachments: true,
        },
    });

    if (!originalTask) {
        return errorResponse('Không tìm thấy công việc', 404);
    }

    // Check source task visibility
    const sourcePermissions = await getUserPermissions(user.id, originalTask.projectId);
    if (!TaskPolicy.canViewTask(user, originalTask as any, sourcePermissions)) {
        return errorResponse('Không có quyền xem công việc gốc', 403);
    }

    const projectId = targetProjectId || originalTask.projectId;

    // Check permission to create in target project
    const targetPermissions = await getUserPermissions(user.id, projectId);
    const canCreate = TaskPolicy.canCreateTask(user, targetPermissions);

    if (!canCreate) {
        return errorResponse('Bạn không có quyền tạo công việc trong dự án đích', 403);
    }


    // Get default status
    const defaultStatus = await prisma.status.findFirst({
        where: { isDefault: true },
    });

    if (!defaultStatus) {
        return errorResponse('Hệ thống chưa cấu hình trạng thái mặc định', 500);
    }

    // Copy the task with overrides if provided
    const copiedTask = await prisma.task.create({
        data: {
            title: body.title || `${originalTask.title} (Copy)`,
            description: body.description !== undefined ? body.description : originalTask.description,
            trackerId: body.trackerId || originalTask.trackerId,
            statusId: body.statusId || defaultStatus.id,
            priorityId: body.priorityId || originalTask.priorityId,
            assigneeId: body.assigneeId || null,
            versionId: body.versionId || null,
            projectId,
            creatorId: user.id,
            estimatedHours: body.estimatedHours !== undefined ? body.estimatedHours : originalTask.estimatedHours,
            doneRatio: body.doneRatio !== undefined ? body.doneRatio : 0,
            startDate: body.startDate !== undefined ? body.startDate : originalTask.startDate,
            dueDate: body.dueDate !== undefined ? body.dueDate : originalTask.dueDate,
            isPrivate: body.isPrivate !== undefined ? body.isPrivate : originalTask.isPrivate,
        },
    });

    // Copy watchers if requested
    if (copyWatchers && originalTask.watchers.length > 0) {
        await prisma.watcher.createMany({
            data: originalTask.watchers.map(w => ({
                taskId: copiedTask.id,
                userId: w.userId,
            })),
            skipDuplicates: true,
        });
    }

    // Copy subtasks if requested
    if (copySubtasks && originalTask.subtasks.length > 0) {
        for (const subtask of originalTask.subtasks) {
            await prisma.task.create({
                data: {
                    title: subtask.title,
                    description: subtask.description,
                    trackerId: subtask.trackerId,
                    statusId: defaultStatus.id,
                    priorityId: subtask.priorityId,
                    projectId,
                    creatorId: user.id,
                    parentId: copiedTask.id,
                    estimatedHours: subtask.estimatedHours,
                    doneRatio: 0,
                    level: subtask.level,
                },
            });
        }
    }

    // Get full copied task
    const result = await prisma.task.findUnique({
        where: { id: copiedTask.id },
        include: {
            tracker: true,
            status: true,
            priority: true,
            project: { select: { id: true, name: true } },
            _count: { select: { subtasks: true } },
        },
    });

    return successResponse(result, 201);
});
