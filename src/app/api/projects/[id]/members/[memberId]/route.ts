import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { ProjectServerService } from '@/server/services/project.server';


// PUT /api/projects/[id]/members/[memberId] - Cập nhật role của member
export const PUT = withAuth(async (req, user, ctx) => {
    const { id, memberId } = await (ctx as RouteContext<{ id: string; memberId: string }>).params;

    try {
        const body = await req.json();
        const member = await ProjectServerService.updateProjectMemberRole(user, id, memberId, body?.roleId);
        return successResponse(member);
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại' || error.message === 'Thành viên không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền quản lý thành viên cho dự án này' || 
            error.message === 'Không thể cập nhật nhân sự là Quản trị viên') {
            return errorResponse(error.message, 403);
        }
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/projects/[id]/members/[memberId] - Xóa member
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id, memberId } = await (ctx as RouteContext<{ id: string; memberId: string }>).params;

    try {
        await ProjectServerService.removeProjectMember(user, id, memberId);
        return successResponse({ message: 'Đã xóa thành viên khỏi dự án' });
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại' || error.message === 'Thành viên không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền quản lý thành viên cho dự án này' || 
            error.message === 'Không thể xóa Quản trị viên khỏi dự án') {
            return errorResponse(error.message, 403);
        }
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
