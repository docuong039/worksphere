import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateTrackerSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// GET /api/trackers/[id] - Lấy chi tiết tracker (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const tracker = await prisma.tracker.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!tracker) {
            return errorResponse('Tracker không tồn tại', 404);
        }

        return successResponse(tracker);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/trackers/[id] - Cập nhật tracker (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    const validatedData = updateTrackerSchema.parse(body);

    // Nếu set isDefault, bỏ default của các tracker khác
    if (validatedData.isDefault) {
        await prisma.tracker.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const tracker = await prisma.tracker.update({
        where: { id },
        data: validatedData,
    });

    return successResponse(tracker);
});

// DELETE /api/trackers/[id] - Xóa tracker (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Kiểm tra có tasks đang dùng tracker này không
    const taskCount = await prisma.task.count({
        where: { trackerId: id },
    });

    if (taskCount > 0) {
        return errorResponse(
            `Không thể xóa tracker đang được sử dụng bởi ${taskCount} công việc`,
            400
        );
    }

    await prisma.tracker.delete({
        where: { id },
    });

    return successResponse({ message: 'Đã xóa tracker' });
});
