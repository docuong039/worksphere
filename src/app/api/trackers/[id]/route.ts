import { successResponse, errorResponse } from '@/lib/api-error';
import { updateTrackerSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TrackerServerService } from '@/server/services/tracker.server';

// GET /api/trackers/[id] - Lấy chi tiết tracker (public)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const tracker = await TrackerServerService.getTrackerById(id);
        return successResponse(tracker);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// PUT /api/trackers/[id] - Cập nhật tracker (admin only)
export const PUT = withAdmin(async (req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updateTrackerSchema.parse(body);

        const tracker = await TrackerServerService.updateTracker(id, validatedData);
        return successResponse(tracker);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/trackers/[id] - Xóa tracker (admin only)
export const DELETE = withAdmin(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await TrackerServerService.deleteTracker(id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
