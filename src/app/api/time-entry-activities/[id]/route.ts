import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { createActivitySchema } from '@/lib/validations';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const activity = await prisma.timeEntryActivity.findUnique({
            where: { id },
        });

        if (!activity) {
            return errorResponse('Không tìm thấy hoạt động', 404);
        }

        return successResponse(activity);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        if (!session.user.isAdministrator) {
            return errorResponse('Chỉ quản trị viên mới có quyền cập nhật', 403);
        }

        const { id } = await params;
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
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        if (!session.user.isAdministrator) {
            return errorResponse('Chỉ quản trị viên mới có quyền xóa', 403);
        }

        const { id } = await params;

        // Check if activity is being used
        const usageCount = await prisma.timeLog.count({
            where: { activityId: id },
        });

        if (usageCount > 0) {
            return errorResponse(`Không thể xóa vì đang được sử dụng bởi ${usageCount} bản ghi thời gian`, 400);
        }

        await prisma.timeEntryActivity.delete({ where: { id } });

        return successResponse({ message: 'Đã xóa hoạt động' });
    } catch (error) {
        return handleApiError(error);
    }
}
