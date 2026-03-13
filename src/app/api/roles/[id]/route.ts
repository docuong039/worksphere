import { successResponse, errorResponse } from '@/lib/api-error';
import { updateRoleSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { RoleServerService } from '@/server/services/role.server';

// GET /api/roles/[id] - Lấy chi tiết role (public, không cần auth)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const role = await RoleServerService.getRoleById(id);
        return successResponse(role);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// PUT /api/roles/[id] - Cập nhật role (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updateRoleSchema.parse(body);

        const role = await RoleServerService.updateRole(id, validatedData);
        return successResponse(role);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/roles/[id] - Xóa role (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await RoleServerService.deleteRole(id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
