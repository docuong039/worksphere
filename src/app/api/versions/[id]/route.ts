import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateVersionSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const version = await prisma.version.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true, identifier: true } },
                tasks: {
                    include: {
                        status: { select: { id: true, name: true, isClosed: true } },
                        priority: { select: { id: true, name: true, color: true } },
                        assignee: { select: { id: true, name: true, avatar: true } },
                        tracker: { select: { id: true, name: true } },
                    },
                    orderBy: [{ status: { position: 'asc' } }, { priority: { position: 'desc' } }],
                },
            },
        });

        if (!version) {
            return errorResponse('Version không tồn tại', 404);
        }

        const canAccess =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: version.projectId },
            }));

        if (!canAccess) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const closedTasks = version.tasks.filter((t) => t.status.isClosed).length;
        const totalTasks = version.tasks.length;
        const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

        return successResponse({
            ...version,
            closedTasks,
            totalTasks,
            progress,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const existingVersion = await prisma.version.findUnique({
            where: { id },
            select: { projectId: true },
        });

        if (!existingVersion) {
            return errorResponse('Version không tồn tại', 404);
        }

        const canManage =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: {
                    userId: session.user.id,
                    projectId: existingVersion.projectId,
                    role: {
                        permissions: {
                            some: {
                                permission: { key: 'projects.manage_versions' },
                            },
                        },
                    },
                },
            }));

        if (!canManage) {
            return errorResponse('Không có quyền sửa version', 403);
        }

        const body = await req.json();
        const validatedData = updateVersionSchema.parse(body);

        const version = await prisma.version.update({
            where: { id },
            data: {
                ...validatedData,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            },
        });

        return successResponse(version);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const existingVersion = await prisma.version.findUnique({
            where: { id },
            select: { projectId: true, _count: { select: { tasks: true } } },
        });

        if (!existingVersion) {
            return errorResponse('Version không tồn tại', 404);
        }

        const canManage =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: {
                    userId: session.user.id,
                    projectId: existingVersion.projectId,
                    role: {
                        permissions: {
                            some: {
                                permission: { key: 'projects.manage_versions' },
                            },
                        },
                    },
                },
            }));

        if (!canManage) {
            return errorResponse('Không có quyền xóa version', 403);
        }

        if (existingVersion._count.tasks > 0) {
            await prisma.task.updateMany({
                where: { versionId: id },
                data: { versionId: null },
            });
        }

        await prisma.version.delete({
            where: { id },
        });

        return successResponse({ message: 'Đã xóa version' });
    } catch (error) {
        return handleApiError(error);
    }
}
