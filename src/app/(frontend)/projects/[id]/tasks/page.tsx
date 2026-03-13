import { auth } from '@/lib/auth';
import { TaskList } from '@/components/Tasks/TaskList';
import { TaskWithRelations, SavedQueryWithRelations } from '@/types';
import { notFound, redirect } from 'next/navigation';
import { TaskServerService } from '@/server/services/task.server';

export default async function ProjectTasksPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<any> }) {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const { id } = await params;
    const sParams = await searchParams;

    const res = await TaskServerService.getProjectTasksData(session.user, id, new URLSearchParams(sParams));

    if (!res) notFound();
    if ('accessDenied' in res) {
        redirect('/dashboard');
    }

    const {
        tasks,
        pagination,
        trackers,
        statuses,
        priorities,
        projects,
        queries,
        users,
        canAssignOthers,
        canCreateTask,
        projectPermissionsMap,
        allowedTrackerIdsByProject
    } = res;

    return (
        <TaskList
            initialTasks={tasks as unknown as TaskWithRelations[]}
            initialPagination={pagination}
            trackers={trackers}
            statuses={statuses}
            priorities={priorities}
            projects={projects}
            queries={queries as unknown as SavedQueryWithRelations[]}
            users={users}
            currentUserId={session.user.id}
            projectId={id}
            canAssignOthers={canAssignOthers}
            canCreateTask={canCreateTask}
            projectPermissionsMap={projectPermissionsMap}
            allowedTrackerIdsByProject={allowedTrackerIdsByProject}
        />
    );
}
