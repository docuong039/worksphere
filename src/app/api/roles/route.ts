import { successResponse, errorResponse } from '@/lib/api-error';
import { createRoleSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import { RoleServerService } from '@/server/services/role.server';

// GET /api/roles - Lấy danh sách roles (public, không cần auth)
export async function GET() {
    try {
        const roles = await RoleServerService.getRoles();
        return successResponse(roles);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// POST /api/roles - Tạo role mới (admin only)
export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const validatedData = createRoleSchema.parse(body);

        const role = await RoleServerService.createRole(validatedData);
        return successResponse(role, 201);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
