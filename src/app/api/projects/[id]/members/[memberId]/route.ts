import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string; memberId: string }>;
}

// Helper: Check if user can manage project members
async function canManageMembers(userId: string, projectId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { creatorId: true },
    });

    if (project?.creatorId === userId) return true;

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

// PUT /api/projects/[id]/members/[memberId] - Cập nhật role của member
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id, memberId } = await params;

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
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/projects/[id]/members/[memberId] - Xóa member
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id, memberId } = await params;

        // Check permission
        const canManage = await canManageMembers(
            session.user.id,
            id,
            session.user.isAdministrator
        );

        if (!canManage) {
            return errorResponse('Không có quyền quản lý thành viên', 403);
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
        const project = await prisma.project.findUnique({
            where: { id },
            select: { creatorId: true },
        });

        if (project?.creatorId === member.user.id) {
            return errorResponse('Không thể xóa người tạo dự án khỏi danh sách thành viên', 400);
        }

        // Check if member has assigned tasks
        const assignedTasks = await prisma.task.count({
            where: {
                projectId: id,
                assigneeId: member.user.id,
            },
        });

        if (assignedTasks > 0) {
            return errorResponse(
                `Không thể xóa thành viên đang được gán ${assignedTasks} công việc. Vui lòng reassign trước.`,
                400
            );
        }

        // Delete member
        await prisma.projectMember.delete({
            where: { id: memberId },
        });

        return successResponse({ message: 'Đã xóa thành viên khỏi dự án' });
    } catch (error) {
        return handleApiError(error);
    }
}
