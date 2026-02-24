import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateStatusSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// GET /api/statuses/[id] - Lấy chi tiết status (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const status = await prisma.status.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!status) {
            return errorResponse('Status không tồn tại', 404);
        }

        return successResponse(status);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/statuses/[id] - Cập nhật status (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    const validatedData = updateStatusSchema.parse(body);

    // Nếu set isDefault, bỏ default của các status khác
    if (validatedData.isDefault) {
        await prisma.status.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const status = await prisma.status.update({
        where: { id },
        data: validatedData,
    });

    return successResponse(status);
});

// DELETE /api/statuses/[id] - Xóa status (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Kiểm tra có tasks đang dùng status này không
    const taskCount = await prisma.task.count({
        where: { statusId: id },
    });

    if (taskCount > 0) {
        return errorResponse(
            `Không thể xóa status đang được sử dụng bởi ${taskCount} công việc`,
            400
        );
    }

    // Kiểm tra có workflow transitions dùng status này không
    const transitionCount = await prisma.workflowTransition.count({
        where: {
            OR: [{ fromStatusId: id }, { toStatusId: id }],
        },
    });

    if (transitionCount > 0) {
        return errorResponse(
            'Không thể xóa status đang được sử dụng trong workflow',
            400
        );
    }

    await prisma.status.delete({
        where: { id },
    });

    return successResponse({ message: 'Đã xóa status' });
});
