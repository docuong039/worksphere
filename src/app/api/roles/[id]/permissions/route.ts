import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/roles/[id]/permissions - Lấy permissions của role
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const rolePermissions = await prisma.rolePermission.findMany({
            where: { roleId: id },
            include: {
                permission: true,
            },
        });

        return successResponse(rolePermissions.map((rp) => rp.permission));
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/roles/[id]/permissions - Cập nhật permissions của role
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;
        const body = await req.json();
        const { permissionIds } = body;

        if (!Array.isArray(permissionIds)) {
            return errorResponse('permissionIds phải là một mảng', 400);
        }

        // Kiểm tra role tồn tại
        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) {
            return errorResponse('Role không tồn tại', 404);
        }

        // Xóa tất cả permissions cũ
        await prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });

        // Thêm permissions mới
        if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissionIds.map((permissionId: string) => ({
                    roleId: id,
                    permissionId,
                })),
            });
        }

        // Lấy lại role với permissions mới
        const updatedRole = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return successResponse(updatedRole);
    } catch (error) {
        return handleApiError(error);
    }
}
