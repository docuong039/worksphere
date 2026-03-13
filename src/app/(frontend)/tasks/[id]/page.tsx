import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { TaskDetail } from '@/components/tasks/task-detail';
import { TaskWithRelations } from '@/types';
import { TaskServerService } from '@/server/services/task.server';


interface Props {
    params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
        redirect('/login');
    }

    const { 
        task, 
        accessDenied, 
        trackers, 
        statuses, 
        priorities, 
        versions, 
        allowedStatuses, 
        canEdit, 
        canFullEdit, 
        canManageWatchers, 
        canAssignOthers 
    } = await TaskServerService.getTaskDetailData(session.user, id);

    if (!task) {
        notFound();
    }

    if (accessDenied) {
        notFound();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedTask = task as any;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-start gap-4 mb-6">
                <div className="mt-1">
                    <BackButton />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Link
                            href={`/projects/${typedTask.project.id}`}
                            className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100 hover:bg-blue-100 transition-all"
                        >
                            {typedTask.project.name}
                        </Link>
                        <span className="text-gray-500">/</span>
                        <div className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                            {typedTask.tracker.name}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-mono font-bold text-gray-500">#{typedTask.number}</span>
                        <h1 className={`text-2xl font-bold tracking-tight ${typedTask.status.isClosed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {typedTask.title}
                        </h1>
                    </div>
                </div>
            </div>

            <TaskDetail
                task={typedTask as unknown as TaskWithRelations}
                trackers={trackers!}
                statuses={statuses!}
                priorities={priorities!}
                versions={versions!}
                allowedStatuses={allowedStatuses as unknown as any[]}
                canEdit={canEdit!}
                canFullEdit={canFullEdit!}
                canAssignOthers={canAssignOthers!}
                currentUserId={session.user.id!}
                allowedTrackerIds={trackers!.map(t => t.id)}
                canManageWatchers={canManageWatchers!}
            />
        </div>
    );
}
