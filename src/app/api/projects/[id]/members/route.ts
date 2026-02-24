import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';

import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';
import { notifyProjectMemberAdded } from '@/lib/notifications';


// GET /api/projects/[id]/members - Lấy danh sách members
export const GET = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const { searchParams } = new URL(req.url);
    const assignableOnly = searchParams.get('assignable') === 'true';

    // 1. Resolve Project ID (supports UUID or Identifier)
    const project = await prisma.project.findFirst({
        where: {
            OR: [
                { id: id },
                { identifier: id }
            ]
        },
        select: { id: true }
    });

    if (!project) {
        return successResponse([]); // Or 404, but empty list is safer for UI
    }

    const projectId = project.id;

    // 2. Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, projectId);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập thông tin thành viên dự án này', 403);
    }

    let limitToSelf = false;

    // Check if user has permission to assign tasks to others (RBAC part of logic)
    if (assignableOnly && !user.isAdministrator) {
        const hasAssignPermission = userPermissions.includes(PERMISSIONS.TASKS.ASSIGN_OTHERS);

        if (!hasAssignPermission) {
            limitToSelf = true;
        }
    }


    const members = await prisma.projectMember.findMany({
        where: {
            projectId,
            ...(limitToSelf ? { userId: user.id } : {}),
            ...(assignableOnly ? { role: { assignable: true } } : {})
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    isActive: true,
                },
            },
            role: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return successResponse(members);
});

// POST /api/projects/[id]/members - Thêm member
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // 1. Resolve Project ID and Load resource
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true, creatorId: true, isArchived: true }
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
    const { userId, userIds, roleId } = body;

    if ((!userId && (!userIds || userIds.length === 0)) || !roleId) {
        return errorResponse('Cần chọn người dùng và vai trò', 400);
    }

    const idsToAdd: string[] = userIds || [userId];

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        return errorResponse('Vai trò không tồn tại', 400);
    }

    // Find existing members to exclude
    const existingMembers = await prisma.projectMember.findMany({
        where: {
            projectId: id,
            userId: { in: idsToAdd }
        },
        select: { userId: true }
    });

    const existingUserIds = existingMembers.map(m => m.userId);
    const finalIdsToAdd = idsToAdd.filter(uid => !existingUserIds.includes(uid));

    if (finalIdsToAdd.length === 0) {
        return errorResponse('Tất cả người dùng được chọn đã là thành viên', 400);
    }

    // Add members
    const result = await prisma.projectMember.createMany({
        data: finalIdsToAdd.map(uid => ({
            projectId: id,
            userId: uid,
            roleId: roleId
        }))
    });

    // Notify added members (async, fire-and-forget)
    const projectInfo = await prisma.project.findUnique({
        where: { id: project.id },
        select: { name: true }
    });
    if (projectInfo) {
        const actorName = user.name || 'Ai đó';
        for (const uid of finalIdsToAdd) {
            if (uid !== user.id) {
                notifyProjectMemberAdded(project.id, projectInfo.name, uid, actorName);
            }
        }
    }


    return successResponse({ count: result.count, message: `Đã thêm ${result.count} thành viên` }, 201);
});
