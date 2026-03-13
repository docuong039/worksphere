import { ProjectServerService } from '@/server/services/project.server';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { successResponse, errorResponse } from '@/lib/api-error';


// POST /api/projects/[id]/archive - Archive/Unarchive project
export const POST = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const updatedProject = await ProjectServerService.toggleArchiveProject(user, id);
        return successResponse({
            message: updatedProject.isArchived ? 'Đã lưu trữ dự án' : 'Đã khôi phục dự án',
            project: updatedProject,
        });
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Bạn không có quyền lưu trữ/khôi phục dự án này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
