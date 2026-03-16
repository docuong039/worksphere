import { successResponse, errorResponse } from '@/lib/api-error';
import { withAdmin } from '@/server/middleware/withAuth';
import { TrackerServerService } from '@/server/services/tracker.server';

// PUT /api/trackers/reorder
export const PUT = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const { items } = body;
        if (!Array.isArray(items)) {
            return errorResponse('items phải là một mảng', 400);
        }
        const result = await TrackerServerService.reorderTrackers(items);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
