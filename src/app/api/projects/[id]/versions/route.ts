import { successResponse, errorResponse } from '@/lib/api-error';
import { createVersionSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { ProjectServerService } from '@/server/services/project.server';


export const GET = withAuth(async (_req, user, ctx) => {
    const { id: projectId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const versionsWithProgress = await ProjectServerService.getProjectVersions(user, projectId);
        return successResponse(versionsWithProgress);
    } catch (error: any) {
        if (error.message === 'Không có quyền truy cập dự án này') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
});

export const POST = withAuth(async (req, user, ctx) => {
    const { id: projectId } = await (ctx as RouteContext<{ id: string }>).params;

    try {
        const body = await req.json();
        const validatedData = createVersionSchema.parse({ ...body, projectId });
        const version = await ProjectServerService.createProjectVersion(user, projectId, validatedData);
        return successResponse(version, 201);
    } catch (error: any) {
        if (error.message === 'Không có quyền tạo version') return errorResponse(error.message, 403);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
