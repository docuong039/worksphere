import prisma from '@/lib/prisma';

// ==========================================
// Cascade Delete Logic
// ==========================================


/**
 * Delete all project related data recursively
 */
export async function deleteProjectData(projectId: string) {
    return prisma.$transaction(async (tx) => {
        // 1. Delete tasks related data
        // Comments
        await tx.comment.deleteMany({
            where: { task: { projectId } },
        });

        // Attachments
        await tx.attachment.deleteMany({
            where: { task: { projectId } },
        });

        // Watchers
        await tx.watcher.deleteMany({
            where: { task: { projectId } },
        });

        // Time Logs
        await tx.timeLog.deleteMany({
            where: { task: { projectId } },
        });

        // Workflow transitions (if any custom) - n/a for now as workflow is global or per tracker/role

        // 2. Delete tasks
        await tx.task.deleteMany({
            where: { projectId },
        });

        // 3. Delete project structure
        // Versions
        await tx.version.deleteMany({
            where: { projectId },
        });

        // Project Trackers
        await tx.projectTracker.deleteMany({
            where: { projectId },
        });

        // Members
        await tx.projectMember.deleteMany({
            where: { projectId },
        });

        // 4. Finally delete project
        await tx.project.delete({
            where: { id: projectId },
        });
    });
}

// ==========================================
// Query Constants
// ==========================================

export const PROJECT_DETAIL_INCLUDE = {
    creator: {
        select: { id: true, name: true, email: true, avatar: true },
    },
    members: {
        include: {
            user: {
                select: { id: true, name: true, email: true, avatar: true },
            },
            role: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: 'asc' as const },
    },
    _count: {
        select: {
            tasks: true,
            members: true,
        },
    },
} as const;
