import prisma from '@/lib/prisma';
import { PriorityList } from '@/components/priorities/priority-list';

export default async function PrioritiesPage() {
    const priorities = await prisma.priority.findMany({
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
                    <h1 className="text-2xl font-semibold text-gray-900">Độ ưu tiên</h1>
                    <p className="text-gray-500 mt-1">Quản lý độ ưu tiên công việc (Thấp, Bình thường, Cao...)</p>
                </div>
            </div>

            <PriorityList priorities={priorities} />
        </div>
    );
}
