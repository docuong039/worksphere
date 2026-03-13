import { successResponse, errorResponse } from '@/lib/api-error';
import { updateVersionSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { ProjectServerService } from '@/server/services/project.server';

export const GET = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await ProjectServerService.getVersionById(user, id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

export const PUT = withAuth(async (req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();
        const validatedData = updateVersionSchema.parse(body);

        const version = await ProjectServerService.updateVersion(user, id, validatedData);
        return successResponse(version);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});

export const DELETE = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const result = await ProjectServerService.deleteVersion(user, id);
        return successResponse(result);
    } catch (error: any) {
        if (error.message.includes('-404')) return errorResponse(error.message.replace('-404', ''), 404);
        if (error.message.includes('-403')) return errorResponse(error.message.replace('-403', ''), 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});
