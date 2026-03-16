import { successResponse, errorResponse } from '@/lib/api-error';
import { withAdmin } from '@/server/middleware/withAuth';
import { PriorityServerService } from '@/server/services/priority.server';

// PUT /api/priorities/reorder
export const PUT = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const { items } = body;
        if (!Array.isArray(items)) {
            return errorResponse('items phải là một mảng', 400);
        }
        const result = await PriorityServerService.reorderPriorities(items);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
