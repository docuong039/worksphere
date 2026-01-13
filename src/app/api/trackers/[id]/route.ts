import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateTrackerSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/trackers/[id] - Lấy chi tiết tracker
export async function GET(req: NextRequest, { params }: Params) {
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

// PUT /api/trackers/[id] - Cập nhật tracker
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;
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
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/trackers/[id] - Xóa tracker
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;

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
    } catch (error) {
        return handleApiError(error);
    }
}
