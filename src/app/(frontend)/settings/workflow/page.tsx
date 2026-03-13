import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WorkflowEditor } from '@/components/workflow/workflow-editor';
import { SystemServerService } from '@/server/services/system.server';

export default async function WorkflowPage() {
    const session = await auth();

    if (!session?.user?.isAdministrator) {
        redirect('/dashboard');
    }

    const { trackers, statuses, roles, mappedTransitions } = await SystemServerService.getWorkflowData(session.user);

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
