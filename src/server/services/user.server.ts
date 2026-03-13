import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createUserSchema, updateUserSchema } from '@/lib/validations';
import { getUserPermissions } from '@/lib/permissions';
import { ReportPolicy } from '@/server/policies/report.policy';
import * as UserPolicy from '@/server/policies/user.policy';
import { z } from 'zod';

import { SessionUser } from '@/types';

export class UserServerService {
    static async getUsers(user: SessionUser, params: { search: string, page: number, pageSize: number, excludeAdmins: boolean }) {
        const { search, page, pageSize, excludeAdmins } = params;
        const globalPerms = await getUserPermissions(user.id);
        const scope = ReportPolicy.getPersonnelVisibilityScope(user, globalPerms);

        const where: any = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {};

        if (excludeAdmins) {
            where.isAdministrator = false;
        }

        if (!user.isAdministrator) {
            if (scope === 'SELF') {
                where.id = user.id;
            } else if (scope === 'PROJECT_MEMBERS') {
                where.projectMemberships = {
                    some: {
                        project: {
                            members: {
                                some: { userId: user.id }
                            }
                        }
                    }
                };
            }
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                    isAdministrator: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: {
                            projectMemberships: true,
                            assignedTasks: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    static async createUser(payload: z.infer<typeof createUserSchema>) {
        const hashedPassword = await bcrypt.hash(payload.password, 10);

        const newUser = await prisma.user.create({
            data: {
                email: payload.email,
                name: payload.name,
                password: hashedPassword,
                isAdministrator: payload.isAdministrator || false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                isAdministrator: true,
                isActive: true,
                createdAt: true,
            },
        });

        return newUser;
    }

    static async getUserById(user: SessionUser, targetId: string) {
        const canView = UserPolicy.canViewProfile(user, targetId);
        if (!canView) {
            throw new Error('Không có quyền truy cập thông tin người dùng này');
        }

        const foundUser = await prisma.user.findUnique({
            where: { id: targetId },
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
            throw new Error('User không tồn tại');
        }

        return foundUser;
    }

    static async updateUser(user: SessionUser, targetId: string, payload: z.infer<typeof updateUserSchema>) {
        const canUpdate = UserPolicy.canUpdateProfile(user, targetId);
        if (!canUpdate) {
            throw new Error('Không có quyền chỉnh sửa người dùng này');
        }

        if (!UserPolicy.canManageAdminFields(user)) {
            delete payload.isAdministrator;
            delete payload.isActive;
        }

        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetId },
            data: payload,
            select: {
                id: true,
                email: true,
                name: true,
                isAdministrator: true,
                isActive: true,
            },
        });

        return updatedUser;
    }

    static async deleteUser(user: SessionUser, targetId: string) {
        const canDelete = UserPolicy.canDeleteUser(user, targetId);
        if (!canDelete) {
            throw new Error('Không có quyền xóa người dùng này hoặc bạn đang tự xóa chính mình');
        }

        const taskCount = await prisma.task.count({
            where: { assigneeId: targetId },
        });

        if (taskCount > 0) {
            throw new Error(`Không thể xóa user đang được gán ${taskCount} công việc. Vui lòng reassign trước.`);
        }

        await prisma.projectMember.deleteMany({ where: { userId: targetId } });
        await prisma.watcher.deleteMany({ where: { userId: targetId } });
        await prisma.notification.deleteMany({ where: { userId: targetId } });

        await prisma.user.delete({ where: { id: targetId } });
        return true;
    }

    /**
     * Lấy danh sách người dùng cho Settings/Users (Dành cho Quản trị viên)
     */
    static async getSystemUsersData(user: SessionUser) {
        if (!user.isAdministrator) {
            throw new Error('Chỉ Quản trị viên mới được xem dánh sách này');
        }

        return prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isAdministrator: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        projectMemberships: true,
                        assignedTasks: true,
                    },
                },
            },
        });
    }
}
