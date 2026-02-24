import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { PERMISSIONS } from '@/lib/constants';


// POST /api/projects/[id]/archive - Archive/Unarchive project
export const POST = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Kiểm tra quyền (chỉ admin hoặc creator)
    const project = await prisma.project.findUnique({
        where: { id },
        select: { creatorId: true, isArchived: true },
    });

    if (!project) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canArchive = ProjectPolicy.canArchiveProject(user, project as any, userPermissions);

    if (!canArchive) {
        return errorResponse('Bạn không có quyền lưu trữ/khôi phục dự án này', 403);
    }


    // Toggle archive status
    const updatedProject = await prisma.project.update({
        where: { id },
        data: { isArchived: !project.isArchived },
        select: {
            id: true,
            name: true,
            isArchived: true,
        },
    });

    return successResponse({
        message: updatedProject.isArchived ? 'Đã lưu trữ dự án' : 'Đã khôi phục dự án',
        project: updatedProject,
    });
});
