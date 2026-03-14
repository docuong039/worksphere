import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { createProjectSchema } from '@/lib/validations';
import { logCreate } from '@/lib/audit-log';
import { notifyProjectCreated } from '@/lib/notifications';
import { withAuth } from '@/server/middleware/withAuth';

import { PERMISSIONS } from '@/lib/constants';

// Import helpers
import {
    buildProjectFilters,
    PROJECT_LIST_INCLUDE,
} from './helpers';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';
import { ProjectServerService } from '@/server/services/project.server';


// GET /api/projects - Lấy danh sách projects
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    try {
        const data = await ProjectServerService.getProjects(user, searchParams);
        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes('quyền') ? 403 : 500);
    }
});

// POST /api/projects - Tạo project mới
export const POST = withAuth(async (req, user) => {
    try {
        const body = await req.json();
        const validatedData = createProjectSchema.parse(body);
        const newProject = await ProjectServerService.createProject(user, validatedData);
        return successResponse(newProject, 201);
    } catch (error: any) {
        console.error('Lỗi khi tạo dự án:', error);
        return errorResponse(error.message || 'Lỗi hệ thống', 400);
    }
});
