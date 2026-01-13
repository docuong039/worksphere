import prisma from '@/lib/prisma';
import { UserList } from '@/components/users/user-list';

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            isAdministrator: true,
            isActive: true,
            createdAt: true,
            _count: {
                select: {
                    projectMemberships: true,
                    assignedTasks: true,
                },
            },
        },
    });

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
