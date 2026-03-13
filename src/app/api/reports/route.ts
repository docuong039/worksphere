import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { ReportServerService } from '@/server/services/report.server';

// GET /api/reports - Lấy báo cáo
export const GET = withAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const reportData = await ReportServerService.getReport(user, searchParams);
        return successResponse(reportData);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        return errorResponse(error.message, isForbidden ? 403 : 400);
    }
});
