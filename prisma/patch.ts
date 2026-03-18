import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Patching new permission: tasks.remind');
    const existing = await prisma.permission.findUnique({
        where: { key: 'tasks.remind' }
    });
    
    if (!existing) {
        await prisma.permission.create({
            data: {
                key: 'tasks.remind',
                name: 'Nhắc việc',
                module: 'TASKS'
            }
        });
        console.log('Permission added.');
        
        // Add to Manager role as well
        const managerRole = await prisma.role.findFirst({ where: { name: 'Manager' } });
        if (managerRole) {
            const newPerm = await prisma.permission.findUnique({ where: { key: 'tasks.remind' } });
            if (newPerm) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: managerRole.id,
                        permissionId: newPerm.id
                    }
                });
                console.log('Added permission to Manager role.');
            }
        }
    } else {
        console.log('Permission already exists.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
