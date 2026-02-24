import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// GET /api/roles/[id]/permissions - Lấy permissions của role (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

// POST /api/roles/[id]/permissions - Cập nhật permissions của role (admin only)
export const POST = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
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
});
