import prisma from '@/lib/prisma';
import { getSystemSettings } from '@/lib/system-settings';

/**
 * Recalculate parent task attributes based on its subtasks.
 * This should be called whenever a task is created, updated, or deleted.
 */
export async function updateParentAttributes(parentId: string | null): Promise<void> {
    if (!parentId) return;


    // Fetch parent to check current values and get project settings
    const currentParent = await prisma.task.findUnique({
        where: { id: parentId },
        select: {
            startDate: true,
            dueDate: true,
            estimatedHours: true,
            doneRatio: true,
            parentId: true,
            project: {
                select: {
                    parentIssueDates: true,
                    parentIssuePriority: true,
                    parentIssueDoneRatio: true,
                    parentIssueEstimatedHours: true
                }
            }
        }
    });

    if (!currentParent) return;

    // Use project settings
    const pSettings = (currentParent as any).project;
    const systemSettings = getSystemSettings();

    // Determine effective settings (Project overrides System)
    const settings = {
        dates: (pSettings as any)?.parentIssueDates || (systemSettings as any).parent_issue_dates,
        priority: (pSettings as any)?.parentIssuePriority || (systemSettings as any).parent_issue_priority,
        doneRatio: (pSettings as any)?.parentIssueDoneRatio || (systemSettings as any).parent_issue_done_ratio,
        estimatedHours: (pSettings as any)?.parentIssueEstimatedHours || (systemSettings as any).parent_issue_estimated_hours,
    };

    // Fetch all subtasks
    const subtasks = await prisma.task.findMany({
        where: { parentId },
        select: {
            startDate: true,
            dueDate: true,
            estimatedHours: true,
            doneRatio: true,
        }
    });

    if (subtasks.length === 0) return;

    // 1. Calculate Dates
    let minStartDate: Date | null = null;
    let maxDueDate: Date | null = null;

    // 2. Calculate Hours & Ratio
    let totalEstimatedHours = 0;
    let weightedDoneRatioSum = 0;
    let activeSubtasksCount = 0;

    for (const task of subtasks) {
        if (task.startDate) {
            if (!minStartDate || task.startDate < minStartDate) minStartDate = task.startDate;
        }
        if (task.dueDate) {
            if (!maxDueDate || task.dueDate > maxDueDate) maxDueDate = task.dueDate;
        }

        const hours = task.estimatedHours || 0;
        const ratio = task.doneRatio || 0;

        totalEstimatedHours += hours;
        weightedDoneRatioSum += (hours * ratio);
        activeSubtasksCount++;
    }

    let aggregateDoneRatio = 0;
    if (totalEstimatedHours > 0) {
        aggregateDoneRatio = Math.round(weightedDoneRatioSum / totalEstimatedHours);
    } else if (activeSubtasksCount > 0) {
        const totalRatio = subtasks.reduce((sum, t) => sum + (t.doneRatio || 0), 0);
        aggregateDoneRatio = Math.round(totalRatio / activeSubtasksCount);
    }

    // Build update data based on settings
    const updateData: any = {};

    if (settings.dates === 'calculated') {
        updateData.startDate = minStartDate;
        updateData.dueDate = maxDueDate;
    }

    if (settings.estimatedHours === 'calculated') {
        updateData.estimatedHours = totalEstimatedHours > 0 ? totalEstimatedHours : null;
    }

    if (settings.doneRatio === 'calculated') {
        updateData.doneRatio = aggregateDoneRatio;
    }

    if (settings.priority === 'calculated' && subtasks.length > 0) {
        // Fetch all subtasks with their priority positions
        const subtasksWithPriority = await prisma.task.findMany({
            where: { parentId },
            include: { priority: { select: { id: true, position: true } } }
        });

        // Find the one with highest position (most urgent)
        if (subtasksWithPriority.length > 0) {
            const highestPriorityTask = subtasksWithPriority.reduce((prev, curr) =>
                (curr.priority.position > prev.priority.position) ? curr : prev
            );
            updateData.priorityId = highestPriorityTask.priorityId;
        }
    }

    // If nothing to update, just recurse if needed
    if (Object.keys(updateData).length === 0) {
        if (currentParent.parentId) {
            await updateParentAttributes(currentParent.parentId);
        }
        return;
    }

    // Update the parent task
    const updatedParent = await prisma.task.update({
        where: { id: parentId },
        data: updateData,
        select: { id: true, parentId: true }
    });

    // Recursively update Grandparent
    if (updatedParent.parentId) {
        await updateParentAttributes(updatedParent.parentId);
    }
}

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
        select: { id: true }
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
            level: childLevel
        }
    });

    // Recursively update grandchildren
    for (const child of children) {
        await updateSubtasksPathAndLevel(child.id, childPath, childLevel);
    }
}
