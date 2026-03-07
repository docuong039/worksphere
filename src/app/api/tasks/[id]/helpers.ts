/**
 * Helper functions for tasks/[id] API routes
 * Extracted to keep route.ts clean and maintainable
 */

import prisma from '@/lib/prisma';

// ==========================================
// Task ID Resolution
// ==========================================

/**
 * Resolve Task ID - supports both CUID and numeric task number
 */
export async function resolveTaskId(idStr: string): Promise<string | null> {
    // If numeric, look up by number field
    if (/^\d+$/.test(idStr)) {
        const task = await prisma.task.findUnique({
            where: { number: parseInt(idStr) },
            select: { id: true },
        });
        return task?.id || null;
    }
    // Otherwise assume it's a CUID
    return idStr;
}

// ==========================================
// Hierarchy Helpers
// ==========================================


/**
 * Recursively update path and level for all subtasks when a parent task is moved.
 * This ensures data integrity in the task hierarchy.
 */
export async function updateSubtasksPathAndLevel(
    taskId: string,
    newPath: string | null,
    newLevel: number
): Promise<void> {
    // Find all direct children
    const children = await prisma.task.findMany({
        where: { parentId: taskId },
        select: { id: true },
    });

    if (children.length === 0) return;

    // Calculate the path for children
    const childPath = newPath ? `${newPath}.${taskId}` : taskId;
    const childLevel = newLevel + 1;

    // Update all children
    await prisma.task.updateMany({
        where: { parentId: taskId },
        data: {
            path: childPath,
            level: childLevel,
        },
    });

    // Recursively update grandchildren
    for (const child of children) {
        await updateSubtasksPathAndLevel(child.id, childPath, childLevel);
    }
}

/**
 * Tự động tính toán lại % hoàn thành, estimated hours, và ngày tháng của Task Cha
 * Tính theo "Bottom-Up" (Cách 1)
 */
export async function updateParentTaskAggregates(parentId: string): Promise<void> {
    const subtasks = await prisma.task.findMany({
        where: { parentId },
        select: {
            doneRatio: true,
            estimatedHours: true,
            startDate: true,
            dueDate: true,
        }
    });

    if (subtasks.length === 0) return; // Không còn subtask nào thì giữ nguyên như hiện tại (người dùng tự sửa)


    let sumEstimatedHours = 0;
    let sumWeightedDoneRatio = 0;
    let sumDoneRatio = 0;
    let hasEstimatedHours = false;
    let minStartDate: Date | null = null;
    let maxDueDate: Date | null = null;

    for (const sub of subtasks) {
        if (sub.estimatedHours) {
            hasEstimatedHours = true;
            sumEstimatedHours += sub.estimatedHours;
            sumWeightedDoneRatio += (sub.doneRatio * sub.estimatedHours);
        }
        sumDoneRatio += sub.doneRatio;

        if (sub.startDate) {
            if (!minStartDate || sub.startDate < minStartDate) {
                minStartDate = sub.startDate;
            }
        }
        if (sub.dueDate) {
            if (!maxDueDate || sub.dueDate > maxDueDate) {
                maxDueDate = sub.dueDate;
            }
        }
    }

    let calculatedDoneRatio = 0;
    if (hasEstimatedHours && sumEstimatedHours > 0) {
        calculatedDoneRatio = Math.round(sumWeightedDoneRatio / sumEstimatedHours);
    } else {
        calculatedDoneRatio = Math.round(sumDoneRatio / subtasks.length);
    }

    const updatedParent = await prisma.task.update({
        where: { id: parentId },
        data: {
            doneRatio: calculatedDoneRatio,
            // Chỉ ghi è giờ tổng khi subtask thực sự có nhập giờ - giữ nguyên nếu không ai nhập
            ...(hasEstimatedHours ? { estimatedHours: sumEstimatedHours } : {}),
            // Chỉ ghi đè ngày khi subtask thực sự có ngày
            ...(minStartDate ? { startDate: minStartDate } : {}),
            ...(maxDueDate ? { dueDate: maxDueDate } : {}),
        },
        select: {
            parentId: true
        }
    });

    // Đệ quy tính ngược lên cha của cha (nếu có)
    if (updatedParent.parentId) {
        await updateParentTaskAggregates(updatedParent.parentId);
    }
}

// ==========================================
// Query Constants
// ==========================================

/**
 * Standard include for task detail queries
 * TODO: Hiện tại chưa được dùng trực tiếp (GET route và page.tsx có query riêng).
 * Cần refactor để dùng chung và tránh trùng lặp (Technical Debt).
 */
export const TASK_DETAIL_INCLUDE = {
    project: {
        select: { id: true, name: true, identifier: true },
    },
    tracker: { select: { id: true, name: true } },
    status: { select: { id: true, name: true, isClosed: true } },
    priority: { select: { id: true, name: true, color: true } },
    assignee: { select: { id: true, name: true, email: true, avatar: true } },
    creator: { select: { id: true, name: true, email: true, avatar: true } },
    version: { select: { id: true, name: true, status: true } },
    parent: {
        select: {
            id: true,
            title: true,
            number: true,
            status: { select: { id: true, name: true, isClosed: true } },
        },
    },
    subtasks: {
        include: {
            status: { select: { id: true, name: true, isClosed: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
            priority: { select: { id: true, name: true, color: true } },
            timeLogs: { select: { hours: true } }, // Để tính tổng giờ thực tế Bottom-Up
        },
        orderBy: { createdAt: 'asc' as const },
    },
    comments: {
        include: {
            user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' as const },
    },
    attachments: {
        include: {
            user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' as const },
    },
    watchers: {
        include: {
            user: { select: { id: true, name: true, avatar: true } },
        },
    },
    timeLogs: {
        include: {
            user: { select: { id: true, name: true } },
            activity: { select: { id: true, name: true } },
        },
        orderBy: { spentOn: 'desc' as const },
    },
    relatedFrom: {
        include: {
            toTask: {
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: { select: { id: true, name: true, isClosed: true } },
                },
            },
        },
    },
    relatedTo: {
        include: {
            fromTask: {
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: { select: { id: true, name: true, isClosed: true } },
                },
            },
        },
    },
} as const;
