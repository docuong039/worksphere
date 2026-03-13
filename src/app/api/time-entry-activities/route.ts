import { successResponse, errorResponse } from '@/lib/api-error';
import { createActivitySchema } from '@/lib/validations';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';
import { TimeEntryActivityServerService } from '@/server/services/time-entry-activity.server';

export const GET = withAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const activities = await TimeEntryActivityServerService.getActivities(includeInactive);
        return successResponse(activities);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

export const POST = withAdmin(async (req) => {
    try {
        const body = await req.json();
        const validatedData = createActivitySchema.parse(body);

        const activity = await TimeEntryActivityServerService.createActivity(validatedData);
        return successResponse(activity, 201);
    } catch (error: any) {
        if (error.message.includes('-400')) return errorResponse(error.message.replace('-400', ''), 400);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
