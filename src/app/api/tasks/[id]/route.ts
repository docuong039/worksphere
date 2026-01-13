import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateTaskSchema } from '@/lib/validations';
import { notifyTaskAssigned, notifyTaskStatusChanged } from '@/lib/notifications';
import { logUpdate, logDelete } from '@/lib/audit-log';
import { canTransitionStatus } from '@/lib/permissions';
import { updateParentAttributes, updateSubtasksPathAndLevel } from '@/lib/services/task-service';

interface Params {
    params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

// Helper: Resolve Task ID (CUID or Number)
async function resolveTaskId(idStr: string) {
    if (/^\d+$/.test(idStr)) {
        const task = await prisma.task.findUnique({
            where: { number: parseInt(idStr) } as any,
            select: { id: true }
        });

        return task?.id || null;
    }
    return idStr;
}


// Helper: Check if user can access task
async function canAccessTask(userId: string, taskId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true },
    });

    if (!task) return false;

    const membership = await prisma.projectMember.findFirst({
        where: { userId, projectId: task.projectId },
    });

    return !!membership;
}

// Helper: Check if user can edit task
async function canEditTask(
    userId: string,
    taskId: string,
    isAdmin: boolean
): Promise<boolean> {
    if (isAdmin) return true;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { creatorId: true, assigneeId: true, projectId: true },
    });

    if (!task) return false;

    // Fetch user role & permissions in the project
    const membership = await prisma.projectMember.findFirst({
        where: { userId, projectId: task.projectId },
        include: {
            role: {
                include: {
                    permissions: { include: { permission: true } },
                },
            },
        },
    });

    if (!membership) return false;

    const permissions = membership.role.permissions.map(p => p.permission.key);

    // 1. Check 'edit_any' (Edit Any Task)
    if (permissions.includes('tasks.edit_any')) return true;

    // 2. Check 'edit_own' (Edit Own Task)
    if (task.creatorId === userId && permissions.includes('tasks.edit_own')) return true;

    // 3. Check 'edit_assigned' (Edit Assigned Task)
    if (task.assigneeId === userId && permissions.includes('tasks.edit_assigned')) return true;

    return false;
}

// GET /api/tasks/[id] - Lấy chi tiết task
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: rawId } = await params;
        const id = await resolveTaskId(rawId);

        if (!id) return errorResponse('Công việc không tồn tại', 404);

        // Check access
        const canAccess = await canAccessTask(session.user.id, id, session.user.isAdministrator);


        if (!canAccess) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true, isClosed: true, defaultDoneRatio: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        identifier: true,
                        members: {
                            include: {
                                user: { select: { id: true, name: true, avatar: true } },
                                role: true,
                            },
                        },
                    },
                },
                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                version: { select: { id: true, name: true, status: true, dueDate: true } },
                parent: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        status: { select: { name: true, isClosed: true } },
                    },
                },

                subtasks: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        doneRatio: true,
                        status: { select: { id: true, name: true, isClosed: true } },
                        priority: { select: { color: true } },
                        assignee: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },

                comments: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                attachments: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                watchers: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
                relationsFrom: {
                    include: {
                        issueTo: {
                            select: {
                                id: true,
                                title: true,
                                status: { select: { name: true, isClosed: true } },
                                tracker: { select: { name: true } },
                            },
                        },
                    },
                },
                relationsTo: {
                    include: {
                        issueFrom: {
                            select: {
                                id: true,
                                title: true,
                                status: { select: { name: true, isClosed: true } },
                                tracker: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });


        if (!task) {
            return errorResponse('Task không tồn tại', 404);
        }

        return successResponse(task);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/tasks/[id] - Cập nhật task
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: rawId } = await params;
        const id = await resolveTaskId(rawId);

        if (!id) return errorResponse('Công việc không tồn tại', 404);

        // 1. Check Edit Permission
        const canEdit = await canEditTask(session.user.id, id, session.user.isAdministrator);

        if (!canEdit) {
            return errorResponse('Không có quyền sửa task này', 403);
        }

        const body = await req.json();
        const validatedData = updateTaskSchema.parse(body);

        // Get current task for comparison
        const currentTask = await prisma.task.findUnique({
            where: { id },
            select: {
                statusId: true,
                trackerId: true,
                projectId: true,
                title: true,
                assigneeId: true,
                description: true,
                priorityId: true,
                doneRatio: true,
                lockVersion: true,
                parentId: true,
                startDate: true,
                dueDate: true,
                estimatedHours: true,
                versionId: true,
                categoryId: true,
                status: { select: { name: true } },
            },
        });

        if (!currentTask) {
            return errorResponse('Task không tồn tại', 404);
        }

        // Check status transition if status is being changed
        if (validatedData.statusId && currentTask.statusId !== validatedData.statusId) {
            const canTransition = await canTransitionStatus(
                session.user as any,
                id,
                validatedData.statusId
            );

            if (!canTransition) {
                return errorResponse('Không được phép chuyển sang trạng thái này theo quy trình làm việc (Workflow)', 403);
            }
        }

        // Optimistic locking check
        if (validatedData.lockVersion !== undefined && validatedData.lockVersion !== currentTask.lockVersion) {
            return errorResponse('Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.', 409);
        }

        // Check tracker change permissions
        if (validatedData.trackerId && validatedData.trackerId !== currentTask.trackerId) {
            const projectTrackerCount = await prisma.projectTracker.count({
                where: { projectId: currentTask.projectId }
            });

            if (projectTrackerCount > 0) {
                const projectTracker = await prisma.projectTracker.findUnique({
                    where: { projectId_trackerId: { projectId: currentTask.projectId, trackerId: validatedData.trackerId } }
                });
                if (!projectTracker) {
                    return errorResponse('Tracker này không được kích hoạt cho dự án này', 400);
                }
            }

            if (!session.user.isAdministrator) {
                const member = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: { projectId: currentTask.projectId, userId: session.user.id }
                    },
                });
                if (member) {
                    const roleTracker = await prisma.roleTracker.findUnique({
                        where: {
                            roleId_trackerId: { roleId: member.roleId, trackerId: validatedData.trackerId }
                        }
                    });
                    if (!roleTracker) {
                        return errorResponse('Vai trò của bạn không cho cho phép sử dụng Tracker này', 403);
                    }
                }
            }
        }

        if (validatedData.assigneeId && validatedData.assigneeId !== currentTask.assigneeId) {
            const assigneeMember = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: { projectId: currentTask.projectId, userId: validatedData.assigneeId }
                },
            });

            if (!assigneeMember) {
                return errorResponse('Người thực hiện không phải là thành viên của dự án này', 400);
            }

            // Check if requester can assign to others
            if (validatedData.assigneeId !== session.user.id && !session.user.isAdministrator) {
                const requesterMember = await prisma.projectMember.findUnique({
                    where: { projectId_userId: { projectId: currentTask.projectId, userId: session.user.id } },
                    include: { role: true }
                });

                const RoleWithPerm = requesterMember?.role as any;
                return errorResponse('Bạn không có quyền giao việc cho người khác', 403);
            }
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {
            lockVersion: { increment: 1 },
        };

        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.trackerId !== undefined) updateData.trackerId = validatedData.trackerId;
        if (validatedData.priorityId !== undefined) updateData.priorityId = validatedData.priorityId;
        if (validatedData.assigneeId !== undefined) updateData.assigneeId = validatedData.assigneeId || null;
        if (validatedData.versionId !== undefined) updateData.versionId = validatedData.versionId || null;
        if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId || null;
        if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours;
        if (validatedData.isPrivate !== undefined) updateData.isPrivate = validatedData.isPrivate;
        if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
        if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;

        // Handle parentId change - update path and level
        if (validatedData.parentId !== undefined && validatedData.parentId !== currentTask.parentId) {
            if (validatedData.parentId === null) {
                // Moving to root level
                updateData.parentId = null;
                updateData.level = 0;
                updateData.path = null;
            } else {
                // Moving to a new parent
                const newParent = await prisma.task.findUnique({
                    where: { id: validatedData.parentId },
                    select: { id: true, projectId: true, level: true, path: true }
                });

                if (!newParent) {
                    return errorResponse('Không tìm thấy công việc cha', 400);
                }
                if (newParent.projectId !== currentTask.projectId) {
                    return errorResponse('Công việc cha phải thuộc cùng một dự án', 400);
                }
                if (newParent.level >= 4) {
                    return errorResponse('Vượt quá độ sâu tối đa của công việc con (tối đa 5 cấp)', 400);
                }
                // Prevent circular reference
                if (validatedData.parentId === id) {
                    return errorResponse('Công việc không thể là công việc cha của chính nó', 400);
                }

                updateData.parentId = validatedData.parentId;
                updateData.level = newParent.level + 1;
                updateData.path = newParent.path ? `${newParent.path}.${newParent.id}` : newParent.id;
            }
        }

        // Handle done ratio - can be set manually or auto from status
        if (validatedData.doneRatio !== undefined) {
            updateData.doneRatio = validatedData.doneRatio;
        }

        // Handle status change with auto done ratio
        if (validatedData.statusId !== undefined) {
            updateData.statusId = validatedData.statusId;

            const newStatus = await prisma.status.findUnique({
                where: { id: validatedData.statusId },
                select: { isClosed: true, defaultDoneRatio: true },
            });

            // Lấy trạng thái hiện tại để so sánh
            const oldStatus = await prisma.status.findUnique({
                where: { id: currentTask.statusId },
                select: { isClosed: true },
            });

            if (newStatus) {
                // FORCE doneRatio=100 for closed statuses (Redmine standard behavior)
                if (newStatus.isClosed) {
                    updateData.doneRatio = 100;
                } else if (oldStatus?.isClosed && !newStatus.isClosed) {
                    // Chuyển từ CLOSED sang OPEN -> reset doneRatio về mặc định hoặc 0
                    updateData.doneRatio = newStatus.defaultDoneRatio ?? 0;
                } else if (validatedData.doneRatio === undefined && newStatus.defaultDoneRatio !== null) {
                    // If done ratio not manually set, use status default
                    updateData.doneRatio = newStatus.defaultDoneRatio;
                }
            }
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                tracker: { select: { id: true, name: true } },
                status: { select: { id: true, name: true, isClosed: true } },
                priority: { select: { id: true, name: true, color: true } },
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true, avatar: true } },
                version: { select: { id: true, name: true } },
            },
        });

        // 5. Trigger Roll-up Calculation logic
        // Case A: This task has a parent -> update parent
        if (task.parentId) {
            await updateParentAttributes(task.parentId);
        }

        // Case B: Parent was changed (moved task to another parent) -> update OLD parent
        if (currentTask.parentId && currentTask.parentId !== task.parentId) {
            await updateParentAttributes(currentTask.parentId);
        }

        // Case C: If parentId changed, update path/level for all subtasks recursively
        if (validatedData.parentId !== undefined && validatedData.parentId !== currentTask.parentId) {
            const newPath = updateData.path as string | null;
            const newLevel = updateData.level as number;
            await updateSubtasksPathAndLevel(id, newPath, newLevel);
        }

        // Get actor name for notifications
        const actor = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true },
        });

        // Send notifications asynchronously (don't await)
        // Notify if assignee changed
        if (validatedData.assigneeId &&
            validatedData.assigneeId !== currentTask.assigneeId &&
            validatedData.assigneeId !== session.user.id) {
            notifyTaskAssigned(id, task.title, validatedData.assigneeId, actor?.name || 'Ai đó');
        }

        // Notify if status changed
        if (validatedData.statusId && validatedData.statusId !== currentTask.statusId) {
            notifyTaskStatusChanged(
                id,
                task.title,
                session.user.id,
                actor?.name || 'Ai đó',
                currentTask.status.name,
                task.status.name
            );
        }

        // Log update (async)
        logUpdate('task', id, session.user.id,
            {
                title: currentTask.title,
                statusId: currentTask.statusId,
                assigneeId: currentTask.assigneeId,
                priorityId: currentTask.priorityId,
                trackerId: currentTask.trackerId,
                doneRatio: currentTask.doneRatio,
                estimatedHours: currentTask.estimatedHours,
                startDate: currentTask.startDate ? new Date(currentTask.startDate).toISOString().split('T')[0] : null,
                dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : null,
            },
            {
                title: task.title,
                statusId: task.status.id,
                assigneeId: task.assignee?.id,
                priorityId: task.priority.id,
                trackerId: task.tracker.id,
                doneRatio: task.doneRatio,
                estimatedHours: task.estimatedHours,
                startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : null,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
            }
        );

        return successResponse(task);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/tasks/[id] - Xóa task
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Check permission
        const task = await prisma.task.findUnique({
            where: { id },
            select: { creatorId: true, projectId: true, title: true, parentId: true },
        });

        if (!task) {
            return errorResponse('Task không tồn tại', 404);
        }

        // Chỉ creator hoặc admin mới được xóa
        const canDelete =
            session.user.isAdministrator || task.creatorId === session.user.id;

        if (!canDelete) {
            return errorResponse('Không có quyền xóa task này', 403);
        }

        // 1. Fetch direct children
        const children = await prisma.task.findMany({
            where: { parentId: id },
            select: { id: true }
        });

        // 2. Perform deletion and root-level updates in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete related data
            await tx.comment.deleteMany({ where: { taskId: id } });
            await tx.attachment.deleteMany({ where: { taskId: id } });
            await tx.watcher.deleteMany({ where: { taskId: id } });

            // Move direct children to root
            if (children.length > 0) {
                await tx.task.updateMany({
                    where: { id: { in: children.map(c => c.id) } },
                    data: {
                        parentId: null,
                        path: null,
                        level: 0
                    }
                });
            }

            // Delete the task itself
            await tx.task.delete({ where: { id } });
        });

        // 3. Recursively update all sub-levels for each child (now at root)
        // This must be done after the parent is deleted or the link is broken
        for (const child of children) {
            await updateSubtasksPathAndLevel(child.id, null, 0);
        }

        // 4. Trigger rollup for parent after deletion
        if (task.parentId) {
            await updateParentAttributes(task.parentId);
        }

        // Log delete (async)
        logDelete('task', id, session.user.id, { title: task.title, projectId: task.projectId });

        return successResponse({ message: 'Đã xóa công việc' });
    } catch (error) {
        return handleApiError(error);
    }
}
