import { PrismaClient } from '@prisma/client';

async function test() {
    const prisma = new PrismaClient();
    try {
        const roles = await prisma.role.findMany();
        console.log('Roles:', roles.map(r => r.name));

        const managers = await prisma.role.findFirst({ where: { name: 'Manager' } });
        console.log('Manager role found:', !!managers);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
