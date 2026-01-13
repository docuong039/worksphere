import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Xóa các quyền timelog cũ không cần thiết
    const oldPermissions = [
        'timelogs.log',
        'timelogs.edit_own',
        'timelogs.edit_all',
        'timelogs.delete_own',
        'timelogs.delete_all',
    ];

    console.log('Đang xóa các quyền timelog cũ...');

    // Xóa RolePermission trước
    const deletedRolePerms = await prisma.rolePermission.deleteMany({
        where: {
            permission: {
                key: { in: oldPermissions }
            }
        }
    });
    console.log(`Đã xóa ${deletedRolePerms.count} role-permission mappings`);

    // Xóa Permission
    const deletedPerms = await prisma.permission.deleteMany({
        where: {
            key: { in: oldPermissions }
        }
    });
    console.log(`Đã xóa ${deletedPerms.count} permissions`);

    console.log('Hoàn tất!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
