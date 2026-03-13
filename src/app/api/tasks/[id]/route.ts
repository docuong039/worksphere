import { successResponse, errorResponse } from '@/lib/api-error';
import { updateTaskSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TaskServerService } from '@/server/services/task.server';

export const dynamic = 'force-dynamic';

// GET /api/tasks/[id] - Lấy chi tiết task
export const GET = withAuth(async (_req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const task = await TaskServerService.getTask(user, rawId);
        return successResponse(task);
    } catch (error: any) {
        if (error.message === 'Công việc không tồn tại') return errorResponse(error.message, 404);
        if (error.message.includes('quyền truy cập')) return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

// PUT /api/tasks/[id] - Cập nhật task
export const PUT = withAuth(async (req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const body = await req.json();
        const validatedData = updateTaskSchema.parse(body);

        const task = await TaskServerService.updateTask(user, rawId, validatedData);
        return successResponse(task);
    } catch (error: any) {
        if (error.message.includes('không tồn tại')) return errorResponse(error.message.replace('-400', '').replace('-404', ''), 404);
        if (error.message.includes('-409')) return errorResponse(error.message.replace('-409', ''), 409);
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        if (error.message.includes('quyền') || error.message.includes('không được phép')) return errorResponse(error.message, 403);
        
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

// DELETE /api/tasks/[id] - Xóa task
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        await TaskServerService.deleteTask(user, rawId);
        return successResponse({ message: 'Đã xóa công việc' });
    } catch (error: any) {
        if (error.message === 'Công việc không tồn tại') return errorResponse(error.message, 404);
        if (error.message.includes('quyền')) return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
