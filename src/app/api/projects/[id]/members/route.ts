import { ProjectServerService } from '@/server/services/project.server';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { successResponse, errorResponse } from '@/lib/api-error';


// GET /api/projects/[id]/members - Lấy danh sách members
export const GET = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const { searchParams } = new URL(req.url);
    const assignableOnly = searchParams.get('assignable') === 'true';

    try {
        const members = await ProjectServerService.getProjectMembers(user, id, assignableOnly);
        return successResponse(members);
    } catch (error: any) {
        if (error.message === 'Không có quyền truy cập thông tin thành viên dự án này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

// POST /api/projects/[id]/members - Thêm member
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    
    try {
        const body = await req.json();
        const result = await ProjectServerService.addProjectMembers(user, id, body);
        return successResponse({ count: result.count, message: `Đã thêm ${result.count} thành viên` }, 201);
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền quản lý thành viên cho dự án này' || 
            error.message === 'Không thể thêm người quản trị hệ thống vào dự án') {
            return errorResponse(error.message, 403);
        }
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
