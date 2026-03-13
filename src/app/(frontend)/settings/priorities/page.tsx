import { PriorityList } from '@/app/(frontend)/settings/components/PriorityList';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SystemServerService } from '@/server/services/system.server';

export default async function PrioritiesPage() {
    const session = await auth();

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const priorities = await SystemServerService.getPriorities(session.user);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Độ ưu tiên</h1>
                    <p className="text-gray-500 mt-1">Quản lý độ ưu tiên công việc (Thấp, Bình thường, Cao...)</p>
                </div>
            </div>

            <PriorityList priorities={priorities} />
        </div>
    );
}
