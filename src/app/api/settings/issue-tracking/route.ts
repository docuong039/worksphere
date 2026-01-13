import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { getSystemSettings, updateSystemSettings } from '@/lib/system-settings';

// GET /api/settings/issue-tracking
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const settings = getSystemSettings();
        return successResponse(settings);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/settings/issue-tracking
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const body = await req.json();
        const updatedSettings = updateSystemSettings(body);

        return successResponse(updatedSettings);
    } catch (error) {
        return handleApiError(error);
    }
}
