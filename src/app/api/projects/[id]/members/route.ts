import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

// Helper: Check if user can manage project members
async function canManageMembers(userId: string, projectId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    // Check if user is creator
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { creatorId: true },
    });

    if (project?.creatorId === userId) return true;

    // Check if user has manage_members permission
    const membership = await prisma.projectMember.findFirst({
        where: { userId, projectId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    if (!membership) return false;

    return membership.role.permissions.some(
        (rp) => rp.permission.key === 'projects.manage_members'
    );
}

// GET /api/projects/[id]/members - Lấy danh sách members
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const { searchParams } = new URL(req.url);
        const assignableOnly = searchParams.get('assignable') === 'true';

        // Check if requester can assign to others
        let limitToSelf = false;
        if (assignableOnly) {
            const requesterMember = await prisma.projectMember.findFirst({
                where: { projectId: id, userId: session.user.id },
                include: { role: { select: { canAssignToOther: true } } }
            });

            // STRICT MODE: If not explicitly TRUE, we limit to self.
            if (!requesterMember || requesterMember.role.canAssignToOther !== true) {
                limitToSelf = true;
            }
        }

        const members = await prisma.projectMember.findMany({
            where: {
                projectId: id,
                ...(limitToSelf ? { userId: session.user.id } : {})
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
                    select: { id: true, name: true },  // Don't expose internal flags here if not needed, consistency
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return successResponse(members);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/projects/[id]/members - Thêm member
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Check permission
        const canManage = await canManageMembers(
            session.user.id,
            id,
            session.user.isAdministrator
        );

        if (!canManage) {
            return errorResponse('Không có quyền quản lý thành viên', 403);
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
        // createMany does not support 'include' so we might create them and then return success or just count
        const result = await prisma.projectMember.createMany({
            data: finalIdsToAdd.map(uid => ({
                projectId: id,
                userId: uid,
                roleId: roleId
            }))
        });

        return successResponse({ count: result.count, message: `Đã thêm ${result.count} thành viên` }, 201);


    } catch (error) {
        return handleApiError(error);
    }
}
