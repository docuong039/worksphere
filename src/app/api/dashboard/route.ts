import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { DashboardServerService } from '@/server/services/dashboard.server';

// GET /api/dashboard - Lấy dữ liệu dashboard
export const GET = withAuth(async (_req, user) => {
    try {
        const dashboardData = await DashboardServerService.getDashboardData(user);
        return successResponse(dashboardData);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
});
