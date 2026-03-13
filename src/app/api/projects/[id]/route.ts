import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { updateProjectSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { ProjectServerService } from '@/server/services/project.server';


// GET /api/projects/[id] - Lấy chi tiết project
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const result = await ProjectServerService.getProjectWithStats(user, id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền truy cập dự án này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

// PUT /api/projects/[id] - Cập nhật project
export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const body = await req.json();
        const validatedData = updateProjectSchema.parse(body);
        const project = await ProjectServerService.updateProject(user, id, validatedData);
        return successResponse(project);
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền sửa dự án này') return errorResponse(error.message, 403);
        if (error.message === 'Định danh dự án đã tồn tại') return errorResponse(error.message, 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/projects/[id] - Xóa project
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        await ProjectServerService.deleteProject(user, id);
        return successResponse({ message: 'Đã xóa dự án và tất cả dữ liệu liên quan' });
    } catch (error: any) {
        if (error.message === 'Dự án không tồn tại') return errorResponse(error.message, 404);
        if (error.message === 'Không có quyền xóa dự án này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
