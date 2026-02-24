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

// ==========================================
// Query Constants
// ==========================================

/**
 * Standard include for task detail queries
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
