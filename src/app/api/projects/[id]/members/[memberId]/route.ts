import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { PERMISSIONS } from '@/lib/constants';
import { notifyProjectMemberRemoved } from '@/lib/notifications';


// PUT /api/projects/[id]/members/[memberId] - Cập nhật role của member
export const PUT = withAuth(async (req, user, ctx) => {
    const { id, memberId } = await (ctx as RouteContext<{ id: string; memberId: string }>).params;

    // 1. Load project for Policy check
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, creatorId: true, isArchived: true }
    });

    if (!project) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, project.id);
    const canManage = ProjectPolicy.canManageMembers(user, project, userPermissions);

    if (!canManage) {
        return errorResponse('Không có quyền quản lý thành viên cho dự án này', 403);
    }


    const body = await req.json();
    const { roleId } = body;

    if (!roleId) {
        return errorResponse('roleId là bắt buộc', 400);
    }

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        return errorResponse('Vai trò không tồn tại', 400);
    }

    // Update member role
    const member = await prisma.projectMember.update({
        where: { id: memberId },
        data: { roleId },
        include: {
            user: {
                select: { id: true, name: true, email: true, avatar: true },
            },
            role: {
                select: { id: true, name: true },
            },
        },
    });

    return successResponse(member);
});

// DELETE /api/projects/[id]/members/[memberId] - Xóa member
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id, memberId } = await (ctx as RouteContext<{ id: string; memberId: string }>).params;

    // 1. Load project for Policy check
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true, creatorId: true, isArchived: true },
    });

    if (!project) {
        return errorResponse('Dự án không tồn tại', 404);
    }

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, project.id);
    const canManage = ProjectPolicy.canManageMembers(user, project, userPermissions);

    if (!canManage) {
        return errorResponse('Không có quyền quản lý thành viên cho dự án này', 403);
    }


    // Get member info
    const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
        include: {
            user: { select: { id: true } },
        },
    });

    if (!member) {
        return errorResponse('Thành viên không tồn tại', 404);
    }

    // Check if member is project creator
    if (project.creatorId === member.user.id) {
        return errorResponse('Không thể xóa người tạo dự án khỏi danh sách thành viên', 400);
    }

    // Check if member has assigned tasks
    const assignedTasksCount = await prisma.task.count({
        where: {
            projectId: id,
            assigneeId: member.user.id,
        },
    });

    if (assignedTasksCount > 0) {
        return errorResponse(
            `Không thể xóa thành viên đang được gán ${assignedTasksCount} công việc. Vui lòng reassign trước.`,
            400
        );
    }

    // Delete member
    await prisma.projectMember.delete({
        where: { id: memberId },
    });

    // Notify removed member (fire-and-forget, skip if user removing themselves)
    if (member.user.id !== user.id) {
        notifyProjectMemberRemoved(id, project.name, member.user.id, user.name || 'Ai đó');
    }

    return successResponse({ message: 'Đã xóa thành viên khỏi dự án' });

});
