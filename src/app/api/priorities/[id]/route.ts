import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updatePrioritySchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/priorities/[id] - Lấy chi tiết priority
export async function GET(req: NextRequest, { params }: Params) {
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

// PUT /api/priorities/[id] - Cập nhật priority
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;
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
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/priorities/[id] - Xóa priority
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;

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
    } catch (error) {
        return handleApiError(error);
    }
}
