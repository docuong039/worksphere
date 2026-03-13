import { successResponse, errorResponse } from '@/lib/api-error';
import { createUserSchema } from '@/lib/validations';
import { withAdmin, withAuth } from '@/server/middleware/withAuth';
import { UserServerService } from '@/server/services/user.server';

// GET /api/users - Lấy danh sách users (có filter theo quyền)
export const GET = withAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const result = await UserServerService.getUsers(user, searchParams);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
});

// POST /api/users - Tạo user mới (admin only)
export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const validatedData = createUserSchema.parse(body);

        const newUser = await UserServerService.createUser(validatedData);
        return successResponse(newUser, 201);
    } catch (error: any) {
        return errorResponse(error.message, 400); // 400 cho validation error và prisma error
    }
});
