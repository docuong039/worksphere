import prisma from '@/lib/prisma';
import { RoleList } from '@/components/roles/role-list';

export default async function RolesPage() {
    const [roles, permissions, trackers] = await Promise.all([
        prisma.role.findMany({
            orderBy: { name: 'asc' },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                trackers: true,
                _count: {
                    select: { projectMembers: true },
                },
            },
        }),
        prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }],
        }),
        prisma.tracker.findMany({
            orderBy: { position: 'asc' }
        }),
    ]);

    // Group permissions by module
    const groupedPermissions = permissions.reduce(
        (acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = [];
            }
            acc[perm.module].push(perm);
            return acc;
        },
        {} as Record<string, typeof permissions>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Vai trò (Roles)</h1>
                    <p className="text-gray-500 mt-1">
                        Quản lý các vai trò và quyền hạn trong hệ thống
                    </p>
                </div>
            </div>

            <RoleList
                roles={roles}
                groupedPermissions={groupedPermissions}
                allTrackers={trackers}
            />
        </div>
    );
}
