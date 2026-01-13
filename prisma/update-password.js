const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('igf', 10);

    await prisma.user.update({
        where: { email: 'admin@worksphere.com' },
        data: { password: hashedPassword },
    });

    console.log('✅ Password updated to: igf');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
