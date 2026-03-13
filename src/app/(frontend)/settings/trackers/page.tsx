import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TrackerList } from '@/app/(frontend)/settings/components/TrackerList';
import { SystemServerService } from '@/server/services/system.server';

export default async function TrackersPage() {
    const session = await auth();

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const trackers = await SystemServerService.getTrackers(session.user);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Loại công việc</h1>
                    <p className="text-gray-500 mt-1">Quản lý các loại công việc (Lỗi, Tính năng, Nhiệm vụ...)</p>
                </div>
            </div>

            <TrackerList trackers={trackers} />
        </div>
    );
}
