import prisma from '@/lib/prisma';
import { TrackerList } from '@/components/trackers/tracker-list';

export default async function TrackersPage() {
    const trackers = await prisma.tracker.findMany({
        orderBy: { position: 'asc' },
        include: {
            _count: {
                select: { tasks: true },
            },
        },
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Trackers</h1>
                    <p className="text-gray-500 mt-1">Quản lý các loại công việc (Bug, Feature, Task...)</p>
                </div>
            </div>

            <TrackerList trackers={trackers} />
        </div>
    );
}
