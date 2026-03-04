import prisma from '@/lib/prisma';
import { WorkflowEditor } from '@/components/workflow/workflow-editor';

export default async function WorkflowPage() {
    const [trackers, statuses, roles, transitions] = await Promise.all([
        prisma.tracker.findMany({ orderBy: { position: 'asc' } }),
        prisma.status.findMany({ orderBy: { position: 'asc' } }),
        prisma.role.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.workflowTransition.findMany(),
    ]);

    const mappedTransitions = transitions.map(t => ({
        ...t,
        allowed: true // Prisma only stores allowed transitions
    }));

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Quy trình làm việc</h1>
                    <p className="text-gray-500 mt-1">
                        Cấu hình các chuyển đổi trạng thái được phép theo loại công việc và vai trò
                    </p>
                </div>
            </div>

            <WorkflowEditor
                trackers={trackers}
                statuses={statuses}
                roles={roles}
                transitions={mappedTransitions}
            />
        </div>
    );
}
