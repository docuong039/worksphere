import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/tasks/bulk-update - Bulk update multiple tasks
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { taskIds, updates } = body;

        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return NextResponse.json({ error: 'taskIds array is required' }, { status: 400 });
        }

        if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
        }

        // Get all tasks to check permissions
        const tasks = await prisma.task.findMany({
            where: { id: { in: taskIds } },
            select: {
                id: true,
                projectId: true,
                creatorId: true,
                assigneeId: true,
            },
        });

        if (tasks.length === 0) {
            return NextResponse.json({ error: 'No valid tasks found' }, { status: 404 });
        }

        // Group by project for permission checking
        const projectIds = [...new Set(tasks.map(t => t.projectId))];

        // Check edit permission for each project
        const editableProjectIds: string[] = [];

        for (const projectId of projectIds) {
            const canEdit = session.user.isAdministrator ||
                await prisma.projectMember.findFirst({
                    where: {
                        projectId,
                        userId: session.user.id,
                        role: {
                            permissions: {
                                some: {
                                    permission: {
                                        key: { in: ['tasks.edit_any', 'tasks.edit_own'] },
                                    },
                                },
                            },
                        },
                    },
                });

            if (canEdit) {
                editableProjectIds.push(projectId);
            }
        }

        if (editableProjectIds.length === 0) {
            return NextResponse.json({ error: 'No permission to edit any of the selected tasks' }, { status: 403 });
        }

        // Filter tasks to only those in editable projects
        const editableTaskIds = tasks
            .filter(t => editableProjectIds.includes(t.projectId))
            .map(t => t.id);

        // Build update data
        const updateData: Record<string, unknown> = {};

        // Allowed fields for bulk update
        const allowedFields = [
            'statusId',
            'priorityId',
            'assigneeId',
            'versionId',
            'categoryId',
            'trackerId',
            'doneRatio',
            'startDate',
            'dueDate',
            'isPrivate',
        ];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                // Handle clear values
                if (updates[field] === null || updates[field] === '') {
                    if (['assigneeId', 'versionId', 'categoryId'].includes(field)) {
                        updateData[field] = null;
                    }
                } else {
                    updateData[field] = updates[field];
                }
            }
        }

        // Handle date fields
        if (updates.startDate) {
            updateData.startDate = new Date(updates.startDate);
        }
        if (updates.dueDate) {
            updateData.dueDate = new Date(updates.dueDate);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
        }

        // Perform bulk update
        const result = await prisma.task.updateMany({
            where: { id: { in: editableTaskIds } },
            data: updateData,
        });

        // Log audit for each task
        for (const taskId of editableTaskIds) {
            await prisma.auditLog.create({
                data: {
                    action: 'bulk_update',
                    entityType: 'task',
                    entityId: taskId,
                    changes: updateData as Record<string, string | number | boolean | null>,
                    userId: session.user.id,
                },
            });
        }

        return NextResponse.json({
            success: true,
            updatedCount: result.count,
            requestedCount: taskIds.length,
            editableCount: editableTaskIds.length,
        });
    } catch (error) {
        console.error('Error bulk updating tasks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
