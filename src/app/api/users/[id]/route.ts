import { successResponse, errorResponse } from '@/lib/api-error';
import { updateUserSchema } from '@/lib/validations';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { UserServerService } from '@/server/services/user.server';

// GET /api/users/[id] - Lấy chi tiết user
export const GET = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const foundUser = await UserServerService.getUserById(user, id);
        return successResponse(foundUser);
    } catch (error: any) {
        const status = error.message.includes('quyền') ? 403 : 404;
        return errorResponse(error.message, status);
    }
});

// PUT /api/users/[id] - Cập nhật user
export const PUT = withAuth(async (req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updateUserSchema.parse(body);

        const updatedUser = await UserServerService.updateUser(user, id, validatedData);
        return successResponse(updatedUser);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        return errorResponse(error.message, isForbidden ? 403 : 400);
    }
});

// DELETE /api/users/[id] - Xóa user (admin only)
export const DELETE = withAdmin(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        await UserServerService.deleteUser(user, id);
        return successResponse({ message: 'Đã xóa user' });
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        return errorResponse(error.message, isForbidden ? 403 : 400);
    }
});
