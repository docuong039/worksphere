import prisma from '@/lib/prisma';

export class PermissionServerService {
    static async getPermissions() {
        const permissions = await prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }],
        });

        // Group by module
        const grouped = permissions.reduce(
            (acc, perm) => {
                if (!acc[perm.module]) {
                    acc[perm.module] = [];
                }
                acc[perm.module].push(perm);
                return acc;
            },
            {} as Record<string, typeof permissions>
        );

        return {
            permissions,
            grouped,
            modules: Object.keys(grouped),
        };
    }
}
