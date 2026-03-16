import { successResponse, errorResponse } from '@/lib/api-error';
import { withAdmin } from '@/server/middleware/withAuth';
import { TimeEntryActivityServerService } from '@/server/services/time-entry-activity.server';

// PUT /api/time-entry-activities/reorder
export const PUT = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const { items } = body;
        if (!Array.isArray(items)) {
            return errorResponse('items phải là một mảng', 400);
        }
        const result = await TimeEntryActivityServerService.reorderActivities(items);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
