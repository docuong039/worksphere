import { successResponse, errorResponse } from '@/lib/api-error';
import { withAdmin } from '@/server/middleware/withAuth';
import { WorkflowServerService } from '@/server/services/workflow.server';

// GET /api/workflow - Lấy workflow matrix (public)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const result = await WorkflowServerService.getWorkflowMatrix(searchParams);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}

// POST /api/workflow - Cập nhật workflow transitions (admin only)
export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const result = await WorkflowServerService.updateWorkflowTransitions(body);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
