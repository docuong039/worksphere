import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateUserSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Lấy chi tiết user
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        const { id } = await params;

        // Cho phép user xem profile của mình hoặc admin xem tất cả
        if (!session?.user?.isAdministrator && session?.user?.id !== id) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const user = await prisma.user.findUnique({
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

        if (!user) {
            return errorResponse('User không tồn tại', 404);
        }

        return successResponse(user);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/users/[id] - Cập nhật user
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        const { id } = await params;

        // Cho phép user sửa profile của mình hoặc admin sửa tất cả
        const isSelf = session?.user?.id === id;
        const isAdmin = session?.user?.isAdministrator;

        if (!isSelf && !isAdmin) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const body = await req.json();
        const validatedData = updateUserSchema.parse(body);

        // Chỉ admin mới được sửa isAdministrator và isActive
        if (!isAdmin) {
            delete validatedData.isAdministrator;
            delete validatedData.isActive;
        }

        // Hash password nếu có
        if (validatedData.password) {
            validatedData.password = await bcrypt.hash(validatedData.password, 10);
        }

        const user = await prisma.user.update({
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

        return successResponse(user);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/users/[id] - Xóa user
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const { id } = await params;

        // Không cho phép tự xóa mình
        if (session.user.id === id) {
            return errorResponse('Không thể tự xóa tài khoản của mình', 400);
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
    } catch (error) {
        return handleApiError(error);
    }
}
