import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/tasks/[id]/move - Move a task to another project
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { targetProjectId, moveSubtasks } = body;

        if (!targetProjectId) {
            return NextResponse.json({ error: 'targetProjectId is required' }, { status: 400 });
        }

        // Get original task
        const task = await prisma.task.findUnique({
            where: { id },
            include: { subtasks: true },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (task.projectId === targetProjectId) {
            return NextResponse.json({ error: 'Task is already in this project' }, { status: 400 });
        }

        // Check permission to edit in source project
        const canEditSource = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: task.projectId,
                    userId: session.user.id,
                    role: {
                        permissions: {
                            some: { permission: { key: 'tasks.move' } },
                        },
                    },
                },
            });

        if (!canEditSource) {
            return NextResponse.json({ error: 'No permission to move tasks from this project' }, { status: 403 });
        }

        // Check permission to create in target project
        const canCreateTarget = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: targetProjectId,
                    userId: session.user.id,
                    role: {
                        permissions: {
                            some: { permission: { key: 'tasks.create' } },
                        },
                    },
                },
            });

        if (!canCreateTarget) {
            return NextResponse.json({ error: 'No permission to create tasks in target project' }, { status: 403 });
        }

        // Check if target project exists
        const targetProject = await prisma.project.findUnique({
            where: { id: targetProjectId },
        });

        if (!targetProject) {
            return NextResponse.json({ error: 'Target project not found' }, { status: 404 });
        }

        // Move the task
        await prisma.task.update({
            where: { id },
            data: {
                projectId: targetProjectId,
                // Clear version and category as they're project-specific
                versionId: null,
                categoryId: null,
            },
        });

        // Move subtasks if requested
        if (moveSubtasks && task.subtasks.length > 0) {
            await prisma.task.updateMany({
                where: { parentId: id },
                data: {
                    projectId: targetProjectId,
                    versionId: null,
                    categoryId: null,
                },
            });
        }

        // Log the move
        await prisma.auditLog.create({
            data: {
                action: 'move',
                entityType: 'task',
                entityId: id,
                changes: {
                    fromProject: task.projectId,
                    toProject: targetProjectId,
                    movedSubtasks: moveSubtasks && task.subtasks.length > 0 ? task.subtasks.length : 0,
                },
                userId: session.user.id,
            },
        });

        // Get updated task
        const result = await prisma.task.findUnique({
            where: { id },
            include: {
                tracker: true,
                status: true,
                priority: true,
                project: { select: { id: true, name: true, identifier: true } },
                _count: { select: { subtasks: true } },
            },
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error moving task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
