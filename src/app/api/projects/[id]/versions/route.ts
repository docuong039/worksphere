import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { createVersionSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { PERMISSIONS } from '@/lib/constants';


export const GET = withAuth(async (_req, user, ctx) => {
    const { id: projectId } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, projectId);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
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
});

export const POST = withAuth(async (req, user, ctx) => {
    const { id: projectId } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, projectId);
    const canManage = ProjectPolicy.canManageVersions(user, userPermissions);

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
});
