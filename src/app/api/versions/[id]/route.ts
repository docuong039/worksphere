import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { updateVersionSchema } from '@/lib/validations';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';


export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

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
        return errorResponse('Phiên bản không tồn tại', 404);
    }

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, version.projectId);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập phiên bản này', 403);
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
});

export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Load resource for Policy check
    const existingVersion = await prisma.version.findUnique({
        where: { id },
        select: { id: true, projectId: true },
    });

    if (!existingVersion) {
        return errorResponse('Phiên bản không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, existingVersion.projectId);
    const canManage = ProjectPolicy.canManageVersions(user, userPermissions);

    if (!canManage) {
        return errorResponse('Không có quyền chỉnh sửa phiên bản này', 403);
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
});

export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Load resource for Policy check
    const existingVersion = await prisma.version.findUnique({
        where: { id },
        select: { id: true, projectId: true, _count: { select: { tasks: true } } },
    });

    if (!existingVersion) {
        return errorResponse('Phiên bản không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, existingVersion.projectId);
    const canManage = ProjectPolicy.canManageVersions(user, userPermissions);

    if (!canManage) {
        return errorResponse('Không có quyền xóa phiên bản này', 403);
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
});
