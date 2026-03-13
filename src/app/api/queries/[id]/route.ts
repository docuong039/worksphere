import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { QueryServerService } from '@/server/services/query.server';

// GET /api/queries/[id]
export const GET = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const query = await QueryServerService.getQueryById(user, id);
        return successResponse(query);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 500);
    }
});

// PUT /api/queries/[id]
export const PUT = withAuth(async (req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        const body = await req.json();

        const updated = await QueryServerService.updateQuery(user, id, body);
        return successResponse(updated);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});

// DELETE /api/queries/[id]
export const DELETE = withAuth(async (_req, user, ctx) => {
    try {
        const { id } = await (ctx as RouteContext<{ id: string }>).params;
        await QueryServerService.deleteQuery(user, id);
        return successResponse({ message: 'Đã xóa bộ lọc' });
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        const isNotFound = error.message.includes('tìm thấy');
        return errorResponse(error.message, isNotFound ? 404 : isForbidden ? 403 : 400);
    }
});
