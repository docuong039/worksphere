import { successResponse, errorResponse } from '@/lib/api-error';
import { createStatusSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import { StatusServerService } from '@/server/services/status.server';

// GET /api/statuses - Lấy danh sách statuses (public)
export async function GET() {
    try {
        const statuses = await StatusServerService.getStatuses();
        return successResponse(statuses);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// POST /api/statuses - Tạo status mới (admin only)
export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const validatedData = createStatusSchema.parse(body);

        const status = await StatusServerService.createStatus(validatedData);
        return successResponse(status, 201);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
