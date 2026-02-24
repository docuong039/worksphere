import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updatePrioritySchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// GET /api/priorities/[id] - Lấy chi tiết priority (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const priority = await prisma.priority.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!priority) {
            return errorResponse('Priority không tồn tại', 404);
        }

        return successResponse(priority);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/priorities/[id] - Cập nhật priority (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const body = await req.json();
    const validatedData = updatePrioritySchema.parse(body);

    // Nếu set isDefault, bỏ default của các priority khác
    if (validatedData.isDefault) {
        await prisma.priority.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const priority = await prisma.priority.update({
        where: { id },
        data: validatedData,
    });

    return successResponse(priority);
});

// DELETE /api/priorities/[id] - Xóa priority (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Kiểm tra có tasks đang dùng priority này không
    const taskCount = await prisma.task.count({
        where: { priorityId: id },
    });

    if (taskCount > 0) {
        return errorResponse(
            `Không thể xóa priority đang được sử dụng bởi ${taskCount} công việc`,
            400
        );
    }

    await prisma.priority.delete({
        where: { id },
    });

    return successResponse({ message: 'Đã xóa priority' });
});
