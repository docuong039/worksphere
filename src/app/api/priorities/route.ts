import { successResponse, errorResponse } from '@/lib/api-error';
import { createPrioritySchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import { PriorityServerService } from '@/server/services/priority.server';

// GET /api/priorities - Lấy danh sách priorities (public)
export async function GET() {
    try {
        const priorities = await PriorityServerService.getPriorities();
        return successResponse(priorities);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// POST /api/priorities - Tạo priority mới (admin only)
export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const validatedData = createPrioritySchema.parse(body);

        const priority = await PriorityServerService.createPriority(validatedData);
        return successResponse(priority, 201);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
