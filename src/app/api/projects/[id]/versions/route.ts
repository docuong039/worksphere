import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createVersionSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: projectId } = await params;

        const canAccess =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId },
            }));

        if (!canAccess) {
            return errorResponse('Không có quyền truy cập dự án này', 403);
        }

        const versions = await prisma.version.findMany({
            where: { projectId },
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        const versionsWithProgress = await Promise.all(
            versions.map(async (version) => {
                const taskStats = await prisma.task.groupBy({
                    by: ['statusId'],
                    where: { versionId: version.id },
                    _count: true,
                });

                const closedStatuses = await prisma.status.findMany({
                    where: { isClosed: true },
                    select: { id: true },
                });
                const closedStatusIds = closedStatuses.map((s) => s.id);

                const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
                const closedTasks = taskStats
                    .filter((s) => closedStatusIds.includes(s.statusId))
                    .reduce((sum, s) => sum + s._count, 0);

                return {
                    ...version,
                    totalTasks,
                    closedTasks,
                    progress: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                };
            })
        );

        return successResponse(versionsWithProgress);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: projectId } = await params;

        const canManage =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: {
                    userId: session.user.id,
                    projectId,
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
            return errorResponse('Không có quyền tạo version', 403);
        }

        const body = await req.json();
        const validatedData = createVersionSchema.parse({ ...body, projectId });

        const version = await prisma.version.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                status: validatedData.status ?? 'open',
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
                projectId,
            },
        });

        return successResponse(version, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
