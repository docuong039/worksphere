import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { ProjectServerService } from '@/server/services/project.server';


// GET /api/projects/[id]/trackers - Get trackers enabled for a project
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const trackers = await ProjectServerService.getProjectTrackers(user, id);
        return successResponse(trackers);
    } catch (error: any) {
        if (error.message === 'Không có quyền truy cập thông tin này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

// PUT /api/projects/[id]/trackers - Update trackers for a project
export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    
    try {
        const { trackerIds } = await req.json();
        const updatedTrackers = await ProjectServerService.updateProjectTrackers(user, id, trackerIds);
        return successResponse(updatedTrackers);
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền chỉnh sửa loại công việc của dự án này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
