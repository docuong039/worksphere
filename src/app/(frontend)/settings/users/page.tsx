import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserList } from '@/components/users/user-list';
import { UserServerService } from '@/server/services/user.server';

export default async function UsersPage() {
    const session = await auth();

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const users = await UserServerService.getSystemUsersData(session.user);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Người dùng</h1>
                    <p className="text-gray-500 mt-1">Quản lý tài khoản người dùng trong hệ thống</p>
                </div>
            </div>

            <UserList users={users} />
        </div>
    );
}
