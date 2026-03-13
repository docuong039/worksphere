import { successResponse, errorResponse } from '@/lib/api-error';
import { updateStatusSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { StatusServerService } from '@/server/services/status.server';

// GET /api/statuses/[id] - Lấy chi tiết status (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const status = await StatusServerService.getStatusById(id);
        return successResponse(status);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// PUT /api/statuses/[id] - Cập nhật status (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updateStatusSchema.parse(body);

        const status = await StatusServerService.updateStatus(id, validatedData);
        return successResponse(status);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/statuses/[id] - Xóa status (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await StatusServerService.deleteStatus(id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
