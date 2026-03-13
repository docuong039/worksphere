import { errorResponse, successResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TimeLogServerService } from '@/server/services/timelog.server';

export const GET = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const timeLog = await TimeLogServerService.getTimeLogById(user, id);
        return successResponse(timeLog);
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes('quyền') ? 403 : 404);
    }
});

export const PUT = withAuth(async (req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const timeLog = await TimeLogServerService.updateTimeLog(user, id, body);
        return successResponse(timeLog);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('Không tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});

export const DELETE = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        await TimeLogServerService.deleteTimeLog(user, id);
        return successResponse({ message: 'Đã xóa bản ghi thời gian' });
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('Không tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});
