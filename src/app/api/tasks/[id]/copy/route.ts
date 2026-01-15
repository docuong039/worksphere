import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/tasks/[id]/copy - Copy a task
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không được quyền truy cập' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
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
            return NextResponse.json({ error: 'Không tìm thấy công việc' }, { status: 404 });
        }

        const projectId = targetProjectId || originalTask.projectId;

        // Check permission to create in target project
        const canCreate = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId,
                    userId: session.user.id,
                    role: {
                        permissions: {
                            some: { permission: { key: 'tasks.create' } },
                        },
                    },
                },
            });

        if (!canCreate) {
            return NextResponse.json({ error: 'Bạn không có quyền tạo công việc trong dự án đích' }, { status: 403 });
        }

        // Get default status
        const defaultStatus = await prisma.status.findFirst({
            where: { isDefault: true },
        });

        if (!defaultStatus) {
            return NextResponse.json({ error: 'Hệ thống chưa cấu hình trạng thái mặc định' }, { status: 500 });
        }

        // Copy the task
        const copiedTask = await prisma.task.create({
            data: {
                title: `${originalTask.title} (Copy)`,
                description: originalTask.description,
                trackerId: originalTask.trackerId,
                statusId: defaultStatus.id,
                priorityId: originalTask.priorityId,
                projectId,
                creatorId: session.user.id,
                estimatedHours: originalTask.estimatedHours,
                doneRatio: 0,
                startDate: originalTask.startDate,
                dueDate: originalTask.dueDate,
                isPrivate: originalTask.isPrivate,
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

        // Link to original if requested (Chức năng này đã tạm dừng do gỡ bỏ IssueRelation)
        // if (linkOriginal) { ... }

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
                        creatorId: session.user.id,
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

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error copying task:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}
