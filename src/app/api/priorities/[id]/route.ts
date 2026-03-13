import { successResponse, errorResponse } from '@/lib/api-error';
import { updatePrioritySchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PriorityServerService } from '@/server/services/priority.server';

// GET /api/priorities/[id] - Lấy chi tiết priority (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const priority = await PriorityServerService.getPriorityById(id);
        return successResponse(priority);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// PUT /api/priorities/[id] - Cập nhật priority (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updatePrioritySchema.parse(body);

        const priority = await PriorityServerService.updatePriority(id, validatedData);
        return successResponse(priority);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/priorities/[id] - Xóa priority (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await PriorityServerService.deletePriority(id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
