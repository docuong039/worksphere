import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RoleList } from '@/app/(frontend)/settings/components/RoleList';
import { SystemServerService } from '@/server/services/system.server';

export default async function RolesPage() {
    const session = await auth();

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const { roles, permissions, trackers } = await SystemServerService.getRolesData(session.user);

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
                    <h1 className="text-2xl font-semibold text-gray-900">Vai trò</h1>
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
