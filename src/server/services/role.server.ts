import prisma from '@/lib/prisma';
import { createRoleSchema, updateRoleSchema } from '@/lib/validations';
import { z } from 'zod';

export class RoleServerService {
    static async getRoles() {
        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { projectMembers: true },
                },
            },
        });
        return roles;
    }

    static async getRoleById(id: string) {
        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { projectMembers: true },
                },
            },
        });

        if (!role) {
            throw new Error('Role không tồn tại-404');
        }

        return role;
    }

    static async createRole(validatedData: z.infer<typeof createRoleSchema>) {
        const role = await prisma.role.create({
            data: validatedData,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return role;
    }

    static async updateRole(id: string, validatedData: z.infer<typeof updateRoleSchema>) {
        const role = await prisma.role.update({
            where: { id },
            data: validatedData,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return role;
    }

    static async deleteRole(id: string) {
        // Kiểm tra có project members đang dùng role này không
        const memberCount = await prisma.projectMember.count({
            where: { roleId: id },
        });

        if (memberCount > 0) {
            throw new Error(`Không thể xóa role đang được sử dụng bởi ${memberCount} thành viên-400`);
        }

        // Kiểm tra có workflow transitions dùng role này không
        const transitionCount = await prisma.workflowTransition.count({
            where: { roleId: id },
        });

        if (transitionCount > 0) {
            // Xóa workflow transitions của role này
            await prisma.workflowTransition.deleteMany({
                where: { roleId: id },
            });
        }

        // Xóa role permissions
        await prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });

        // Xóa role
        await prisma.role.delete({
            where: { id },
        });

        return { message: 'Đã xóa role' };
    }
}
