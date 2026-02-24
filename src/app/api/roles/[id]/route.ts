import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateRoleSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// GET /api/roles/[id] - Lấy chi tiết role (public, không cần auth)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

// PUT /api/roles/[id] - Cập nhật role (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
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
});

// DELETE /api/roles/[id] - Xóa role (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

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
});
