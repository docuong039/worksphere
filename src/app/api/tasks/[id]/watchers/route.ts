import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TaskServerService } from '@/server/services/task.server';

export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const result = await TaskServerService.getWatchers(user, id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const body = await req.json();
        const targetUserId = body.userId || user.id;

        const watcher = await TaskServerService.addWatcher(user, id, targetUserId);
        return successResponse(watcher, 201);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        if (error.message.includes('-409')) return errorResponse(error.message.replace('-409', ''), 409);
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

export const DELETE = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get('userId') || user.id;

        const result = await TaskServerService.removeWatcher(user, id, targetUserId);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
