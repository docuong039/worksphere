import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateStatusSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/statuses/[id] - Lấy chi tiết status
export async function GET(req: NextRequest, { params }: Params) {
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

// PUT /api/statuses/[id] - Cập nhật status
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;
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
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/statuses/[id] - Xóa status
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;

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
    } catch (error) {
        return handleApiError(error);
    }
}
