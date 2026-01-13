import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateRoleSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/roles/[id] - Lấy chi tiết role
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { projectMembers: true },
                },
            },
        });

        if (!role) {
            return errorResponse('Role không tồn tại', 404);
        }

        return successResponse(role);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/roles/[id] - Cập nhật role
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = updateRoleSchema.parse(body);

        const role = await prisma.role.update({
            where: { id },
            data: validatedData,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return successResponse(role);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/roles/[id] - Xóa role
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;

        // Kiểm tra có project members đang dùng role này không
        const memberCount = await prisma.projectMember.count({
            where: { roleId: id },
        });

        if (memberCount > 0) {
            return errorResponse(
                `Không thể xóa role đang được sử dụng bởi ${memberCount} thành viên`,
                400
            );
        }

        // Kiểm tra có workflow transitions dùng role này không
        const transitionCount = await prisma.workflowTransition.count({
            where: { roleId: id },
        });

        if (transitionCount > 0) {
            // Xóa workflow transitions của role này
            await prisma.workflowTransition.deleteMany({
                where: { roleId: id },
            });
        }

        // Xóa role permissions
        await prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });

        // Xóa role
        await prisma.role.delete({
            where: { id },
        });

        return successResponse({ message: 'Đã xóa role' });
    } catch (error) {
        return handleApiError(error);
    }
}
