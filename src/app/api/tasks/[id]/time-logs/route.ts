import { errorResponse, successResponse } from '@/lib/api-error';
import { createTimeLogSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TaskServerService } from '@/server/services/task.server';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const timeLogs = await TaskServerService.getTimeLogs(user, rawId);
        return successResponse(timeLogs);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        if (error.message.includes('quyền') || error.message.includes('không tìm thấy')) {
            const isForbidden = error.message.includes('quyền');
            return errorResponse(error.message, isForbidden ? 403 : 404);
        }
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

export const POST = withAuth(async (req, user, ctx) => {
    const { id: rawId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const body = await req.json();
        const validatedData = createTimeLogSchema.parse(body);

        const timeLog = await TaskServerService.createTimeLog(user, rawId, validatedData);
        return successResponse(timeLog, 201);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        if (error.message.includes('quyền') || error.message.includes('không tìm thấy')) {
            const isForbidden = error.message.includes('quyền');
            return errorResponse(error.message, isForbidden ? 403 : 404);
        }
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
