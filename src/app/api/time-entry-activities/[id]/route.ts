import { successResponse, errorResponse } from '@/lib/api-error';
import { updateActivitySchema } from '@/lib/validations';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { TimeEntryActivityServerService } from '@/server/services/time-entry-activity.server';

export const GET = withAuth(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const activity = await TimeEntryActivityServerService.getActivityById(id);
        return successResponse(activity);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

export const PUT = withAdmin(async (req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updateActivitySchema.parse(body);

        const activity = await TimeEntryActivityServerService.updateActivity(id, validatedData);
        return successResponse(activity);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

export const DELETE = withAdmin(async (_req, _user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await TimeEntryActivityServerService.deleteActivity(id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
