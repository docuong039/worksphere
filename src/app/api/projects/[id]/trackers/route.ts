import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';


// GET /api/projects/[id]/trackers - Get trackers enabled for a project
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập thông tin này', 403);
    }


    const projectTrackers = await prisma.projectTracker.findMany({
        where: { projectId: id },
        include: {
            tracker: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    position: true,
                    isDefault: true,
                },
            },
        },
        orderBy: { tracker: { position: 'asc' } },
    });

    // If no trackers assigned, return all trackers (default behavior)
    if (projectTrackers.length === 0) {
        const allTrackers = await prisma.tracker.findMany({
            orderBy: { position: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                position: true,
                isDefault: true,
            },
        });
        return successResponse(allTrackers);
    }

    return successResponse(projectTrackers.map(pt => pt.tracker));
});

// PUT /api/projects/[id]/trackers - Update trackers for a project
export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Verify project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canManage = ProjectPolicy.canManageTrackers(user, userPermissions);

    if (!canManage) {
        return errorResponse('Không có quyền chỉnh sửa loại công việc của dự án này', 403);
    }

    const { trackerIds } = await req.json();

    if (!Array.isArray(trackerIds)) {
        return errorResponse('Danh sách ID tracker phải là một mảng', 400);
    }


    // Transaction: delete existing and create new
    await prisma.$transaction(async (tx) => {
        await tx.projectTracker.deleteMany({
            where: { projectId: id },
        });

        if (trackerIds.length > 0) {
            await tx.projectTracker.createMany({
                data: trackerIds.map((trackerId: string) => ({
                    projectId: id,
                    trackerId,
                })),
                skipDuplicates: true,
            });
        }
    });

    const updated = await prisma.projectTracker.findMany({
        where: { projectId: id },
        include: { tracker: true },
    });

    return successResponse(updated.map(pt => pt.tracker));
});
