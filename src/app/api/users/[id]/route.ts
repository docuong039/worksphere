import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { updateUserSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import * as UserPolicy from '@/modules/user/user.policy';


// GET /api/users/[id] - Lấy chi tiết user
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const canView = UserPolicy.canViewProfile(user, id);

    if (!canView) {
        return errorResponse('Không có quyền truy cập thông tin người dùng này', 403);
    }


    const foundUser = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isAdministrator: true,
            isActive: true,
            createdAt: true,
            projectMemberships: {
                include: {
                    project: {
                        select: { id: true, name: true, identifier: true },
                    },
                    role: {
                        select: { id: true, name: true },
                    },
                },
            },
            _count: {
                select: {
                    assignedTasks: true,
                    createdTasks: true,
                },
            },
        },
    });

    if (!foundUser) {
        return errorResponse('User không tồn tại', 404);
    }

    return successResponse(foundUser);
});

// PUT /api/users/[id] - Cập nhật user
export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const canUpdate = UserPolicy.canUpdateProfile(user, id);

    if (!canUpdate) {
        return errorResponse('Không có quyền chỉnh sửa người dùng này', 403);
    }


    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Only admin can modify administrative fields
    if (!UserPolicy.canManageAdminFields(user)) {
        delete validatedData.isAdministrator;
        delete validatedData.isActive;
    }


    // Hash password nếu có
    if (validatedData.password) {
        validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: validatedData,
        select: {
            id: true,
            email: true,
            name: true,
            isAdministrator: true,
            isActive: true,
        },
    });

    return successResponse(updatedUser);
});

// DELETE /api/users/[id] - Xóa user (admin only)
export const DELETE = withAdmin(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const canDelete = UserPolicy.canDeleteUser(user, id);

    if (!canDelete) {
        return errorResponse('Không có quyền xóa người dùng này hoặc bạn đang tự xóa chính mình', 403);
    }


    // Kiểm tra có tasks đang được assign không
    const taskCount = await prisma.task.count({
        where: { assigneeId: id },
    });

    if (taskCount > 0) {
        return errorResponse(
            `Không thể xóa user đang được gán ${taskCount} công việc. Vui lòng reassign trước.`,
            400
        );
    }

    // Xóa các liên kết
    await prisma.projectMember.deleteMany({ where: { userId: id } });
    await prisma.watcher.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });

    // Xóa user
    await prisma.user.delete({ where: { id } });

    return successResponse({ message: 'Đã xóa user' });
});
