import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TaskServerService } from '@/server/services/task.server';

export const POST = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const result = await TaskServerService.toggleWatch(user, id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
