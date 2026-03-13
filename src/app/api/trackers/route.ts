import { successResponse, errorResponse } from '@/lib/api-error';
import { createTrackerSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';
import { TrackerServerService } from '@/server/services/tracker.server';

// GET /api/trackers - Lấy danh sách trackers (public)
export async function GET() {
    try {
        const trackers = await TrackerServerService.getTrackers();
        return successResponse(trackers);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// POST /api/trackers - Tạo tracker mới (admin only)
export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const validatedData = createTrackerSchema.parse(body);

        const tracker = await TrackerServerService.createTracker(validatedData);
        return successResponse(tracker, 201);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
