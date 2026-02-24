import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// GET /api/roles/[id]/trackers - Get trackers assigned to a role
export const GET = withAuth(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const roleTrackers = await prisma.roleTracker.findMany({
        where: { roleId: id },
        include: {
            tracker: {
                select: {
                    id: true,
                    name: true,
                    position: true,
                },
            },
        },
        orderBy: { tracker: { position: 'asc' } },
    });

    return successResponse(roleTrackers.map(rt => rt.tracker));
});

// PUT /api/roles/[id]/trackers - Update trackers for a role (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const { trackerIds } = await req.json();

    if (!Array.isArray(trackerIds)) {
        return errorResponse('Danh sách ID tracker phải là một mảng', 400);
    }

    // Verify role exists
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
        return errorResponse('Không tìm thấy vai trò', 404);
    }

    // Transaction: delete existing and create new
    await prisma.$transaction(async (tx) => {
        // Delete existing
        await tx.roleTracker.deleteMany({
            where: { roleId: id },
        });

        // Create new
        if (trackerIds.length > 0) {
            await tx.roleTracker.createMany({
                data: trackerIds.map((trackerId: string) => ({
                    roleId: id,
                    trackerId,
                })),
                skipDuplicates: true,
            });
        }
    });

    // Return updated list
    const updated = await prisma.roleTracker.findMany({
        where: { roleId: id },
        include: { tracker: true },
    });

    return successResponse(updated.map(rt => rt.tracker));
});
