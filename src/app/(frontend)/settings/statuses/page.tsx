import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StatusList } from '@/components/statuses/status-list';
import { SystemServerService } from '@/server/services/system.server';

export default async function StatusesPage() {
    const session = await auth();

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const statuses = await SystemServerService.getStatuses(session.user);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Trạng thái</h1>
                    <p className="text-gray-500 mt-1">Quản lý trạng thái công việc (Mới, Đang xử lý, Đã đóng...)</p>
                </div>
            </div>

            <StatusList statuses={statuses} />
        </div>
    );
}
