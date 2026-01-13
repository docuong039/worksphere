import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { logCreate } from '@/lib/audit-log';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/tasks/[id]/duplicate - Nhân bản task
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Get original task
        const originalTask = await prisma.task.findUnique({
            where: { id },
            include: {
                project: { select: { id: true } },
                watchers: { select: { userId: true } },
            },
        });

        if (!originalTask) {
            return errorResponse('Task không tồn tại', 404);
        }

        // Check permission
        const canDuplicate =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: originalTask.projectId },
            }));

        if (!canDuplicate) {
            return errorResponse('Không có quyền nhân bản task', 403);
        }

        // Parse options from body
        const body = await req.json().catch(() => ({}));
        const options = {
            copyWatchers: body.copyWatchers ?? false,
            copyAssignee: body.copyAssignee ?? false,
            targetProjectId: body.projectId || originalTask.projectId,
            newTitle: body.title || `${originalTask.title} (Copy)`,
        };

        // Check target project access
        if (options.targetProjectId !== originalTask.projectId) {
            const canAccessTarget =
                session.user.isAdministrator ||
                (await prisma.projectMember.findFirst({
                    where: { userId: session.user.id, projectId: options.targetProjectId },
                }));

            if (!canAccessTarget) {
                return errorResponse('Không có quyền tạo task trong project đích', 403);
            }
        }

        // Find default status for new task
        const defaultStatus = await prisma.status.findFirst({
            where: { isDefault: true },
            select: { id: true },
        });

        // Create duplicated task
        const newTask = await prisma.task.create({
            data: {
                title: options.newTitle,
                description: originalTask.description,
                projectId: options.targetProjectId,
                trackerId: originalTask.trackerId,
                statusId: defaultStatus?.id || originalTask.statusId,
                priorityId: originalTask.priorityId,
                assigneeId: options.copyAssignee ? originalTask.assigneeId : null,
                creatorId: session.user.id,
                estimatedHours: originalTask.estimatedHours,
                dueDate: null, // Don't copy due date
                level: 0,
                path: '',
            },
            include: {
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true, isClosed: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true, avatar: true } },
                creator: { select: { id: true, name: true } },
            },
        });

        // Update path with new task id
        await prisma.task.update({
            where: { id: newTask.id },
            data: { path: newTask.id },
        });

        // Copy watchers if requested
        if (options.copyWatchers && originalTask.watchers.length > 0) {
            await prisma.watcher.createMany({
                data: originalTask.watchers.map((w) => ({
                    taskId: newTask.id,
                    userId: w.userId,
                })),
                skipDuplicates: true,
            });
        }

        // Auto-watch the new task for creator
        await prisma.watcher.create({
            data: {
                taskId: newTask.id,
                userId: session.user.id,
            },
        }).catch(() => { }); // Ignore if already exists

        // Log create
        logCreate('task', newTask.id, session.user.id, {
            title: newTask.title,
            projectId: newTask.project.id,
            duplicatedFrom: id,
        });

        return successResponse({
            task: newTask,
            duplicatedFrom: id,
        }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
