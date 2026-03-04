import prisma from '@/lib/prisma';
import { StatusList } from '@/components/statuses/status-list';

export default async function StatusesPage() {
    const statuses = await prisma.status.findMany({
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
                    <h1 className="text-2xl font-semibold text-gray-900">Trạng thái</h1>
                    <p className="text-gray-500 mt-1">Quản lý trạng thái công việc (Mới, Đang xử lý, Đã đóng...)</p>
                </div>
            </div>

            <StatusList statuses={statuses} />
        </div>
    );
}
