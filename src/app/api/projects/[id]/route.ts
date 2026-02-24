import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { updateProjectSchema } from '@/lib/validations';
import { logUpdate, logDelete } from '@/lib/audit-log';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';

// Import helpers
import {
    deleteProjectData,
    PROJECT_DETAIL_INCLUDE,
} from './helpers';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';


// GET /api/projects/[id] - Lấy chi tiết project
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: PROJECT_DETAIL_INCLUDE,
    });

    if (!project) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập dự án này', 403);
    }


    if (!project) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // Thêm thống kê tasks
    const taskStats = await prisma.task.groupBy({
        by: ['statusId'],
        where: { projectId: id },
        _count: { id: true },
    });

    const statuses = await prisma.status.findMany();
    const tasksByStatus = statuses.map((status) => ({
        status,
        count: taskStats.find((ts) => ts.statusId === status.id)?._count.id || 0,
    }));

    return successResponse({
        ...project,
        tasksByStatus,
    });
});

// PUT /api/projects/[id] - Cập nhật project
export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Load resource first for Policy Check
    const currentProject = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true, description: true, identifier: true, isArchived: true, creatorId: true },
    });

    if (!currentProject) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canUpdate = ProjectPolicy.canUpdateProject(user, currentProject, userPermissions);

    if (!canUpdate) {
        return errorResponse('Không có quyền sửa dự án này', 403);
    }


    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    // Nếu đổi identifier, kiểm tra unique
    if (validatedData.identifier) {
        const existing = await prisma.project.findFirst({
            where: {
                identifier: validatedData.identifier,
                id: { not: id },
            },
        });

        if (existing) {
            return errorResponse('Định danh dự án đã tồn tại', 400);
        }
    }

    const project = await prisma.project.update({
        where: { id },
        data: {
            ...validatedData,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        },
        include: {
            creator: {
                select: { id: true, name: true },
            },
            _count: {
                select: { tasks: true, members: true },
            },
        },
    });

    // Ghi nhật ký hoạt động
    if (currentProject) {
        await logUpdate('project', id, user.id,
            { name: currentProject.name, description: currentProject.description, isArchived: currentProject.isArchived },
            { name: project.name, description: project.description, isArchived: project.isArchived }
        );
    }

    return successResponse(project);
});

// DELETE /api/projects/[id] - Xóa project
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Load resource for Policy check
    const projectToDelete = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true, identifier: true, creatorId: true, isArchived: true },
    });

    if (!projectToDelete) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canDelete = ProjectPolicy.canDeleteProject(user, projectToDelete, userPermissions);

    if (!canDelete) {
        return errorResponse('Không có quyền xóa dự án này', 403);
    }


    // Use helper to delete all related data transactionally
    await deleteProjectData(id);

    // Ghi nhật ký hoạt động
    await logDelete('project', id, user.id, {
        name: projectToDelete?.name,
        identifier: projectToDelete?.identifier,
    });

    return successResponse({ message: 'Đã xóa dự án và tất cả dữ liệu liên quan' });
});
