import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserList } from '@/app/(frontend)/settings/components/UserList';
import { UserServerService } from '@/server/services/user.server';

export default async function UsersPage({ searchParams }: { searchParams: Promise<any> }) {
    const session = await auth();
    const params = await searchParams;

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const urlParams = new URLSearchParams();
    if (params.page) urlParams.set('page', params.page);
    if (params.pageSize) urlParams.set('pageSize', params.pageSize);
    if (params.search) urlParams.set('search', params.search);

    const data = await UserServerService.getSystemUsersData(session.user, urlParams);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Người dùng</h1>
                    <p className="text-gray-500 mt-1">Quản lý tài khoản người dùng trong hệ thống</p>
                </div>
            </div>

            <UserList initialData={data} />
        </div>
    );
}
