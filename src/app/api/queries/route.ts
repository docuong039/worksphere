import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { QueryServerService } from '@/server/services/query.server';

// GET /api/queries - List saved queries
export const GET = withAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const queries = await QueryServerService.getQueries(user, searchParams);
        return successResponse(queries);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
});

// POST /api/queries - Create a new saved query
export const POST = withAuth(async (req, user) => {
    try {
        const body = await req.json();
        const query = await QueryServerService.createQuery(user, body);
        return successResponse(query, 201);
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        return errorResponse(error.message, isForbidden ? 403 : 400);
    }
});
