import { errorResponse, successResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { TimeLogServerService } from '@/server/services/timelog.server';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const result = await TimeLogServerService.getTimeLogs(user, searchParams);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes('quyền') ? 403 : 500);
    }
});

export const POST = withAuth(async (req, user) => {
    try {
        const body = await req.json();
        const timeLog = await TimeLogServerService.createTimeLog(user, body);
        return successResponse(timeLog);
    } catch (error: any) {
        let status = 400;
        if (error.message.includes('quyền')) status = 403;
        return errorResponse(error.message, status);
    }
});
