
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu Migrate quyền tasks.assign_others...');

    try {
        // 1. Tạo permission mới nếu chưa có
        const permissionKey = 'tasks.assign_others';
        let permission = await prisma.permission.findUnique({
            where: { key: permissionKey }
        });

        if (!permission) {
            permission = await prisma.permission.create({
                data: {
                    key: permissionKey,
                    name: 'Giao việc cho người khác',
                    module: 'TASKS'
                }
            });
            console.log('✅ Đã tạo Permission: tasks.assign_others');
        } else {
            console.log('ℹ️ Permission tasks.assign_others đã tồn tại.');
        }

        // 2. Tìm các Role có canAssignToOther = true
        const rolesToUpdate = await prisma.role.findMany({
            where: { canAssignToOther: true }
        });

        console.log(`🔍 Tìm thấy ${rolesToUpdate.length} vai trò có quyền giao việc.`);

        // 3. Gán permission mới cho các role này
        for (const role of rolesToUpdate) {
            const existing = await prisma.rolePermission.findFirst({
                where: {
                    roleId: role.id,
                    permissionId: permission.id
                }
            });

            if (!existing) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: role.id,
                        permissionId: permission.id
                    }
                });
                console.log(`🔗 Đã gán quyền cho vai trò: ${role.name}`);
            } else {
                console.log(`ℹ️ Vai trò ${role.name} đã được gán quyền này trước đó.`);
            }
        }

        console.log('✨ Migration hoàn tất thành công!');
    } catch (error) {
        console.error('❌ Lỗi Migration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
