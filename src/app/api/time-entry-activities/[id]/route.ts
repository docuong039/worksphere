import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-error';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

export const GET = withAuth(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const activity = await prisma.timeEntryActivity.findUnique({
        where: { id },
    });

    if (!activity) {
        return errorResponse('Không tìm thấy hoạt động', 404);
    }

    return successResponse(activity);
});

export const PUT = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();

    const existing = await prisma.timeEntryActivity.findUnique({
        where: { id },
    });

    if (!existing) {
        return errorResponse('Không tìm thấy hoạt động', 404);
    }

    // Check duplicate name if name is being changed
    if (body.name && body.name !== existing.name) {
        const duplicate = await prisma.timeEntryActivity.findFirst({
            where: { name: body.name, id: { not: id } },
        });
        if (duplicate) {
            return errorResponse('Tên hoạt động đã tồn tại', 400);
        }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const activity = await prisma.timeEntryActivity.update({
        where: { id },
        data: updateData,
    });

    return successResponse(activity);
});

export const DELETE = withAdmin(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Check if activity is being used
    const usageCount = await prisma.timeLog.count({
        where: { activityId: id },
    });

    if (usageCount > 0) {
        return errorResponse(`Không thể xóa vì đang được sử dụng bởi ${usageCount} bản ghi thời gian`, 400);
    }

    await prisma.timeEntryActivity.delete({ where: { id } });

    return successResponse({ message: 'Đã xóa hoạt động' });
});
