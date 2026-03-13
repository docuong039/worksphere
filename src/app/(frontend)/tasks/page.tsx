import { auth } from '@/lib/auth';
import { TaskList } from '@/components/tasks/task-list';
import { TaskWithRelations, SavedQueryWithRelations } from '@/types';
import { TaskServerService } from '@/server/services/task.server';
import { redirect } from 'next/navigation';

export default async function TasksPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    const {
        tasks,
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
    } = await TaskServerService.getGlobalTasksData(session.user);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Công việc</h1>
                <p className="text-gray-500 mt-1">Quản lý và theo dõi các công việc</p>
            </div>

            <TaskList
                initialTasks={tasks as unknown as TaskWithRelations[]}
                trackers={trackers}
                statuses={statuses}
                priorities={priorities}
                projects={projects}
                queries={queries as unknown as SavedQueryWithRelations[]}
                users={users}
                currentUserId={session.user.id}
                canAssignOthers={canAssignOthers}
                canCreateTask={canCreateTask}
                projectPermissionsMap={projectPermissionsMap}
                allowedTrackerIdsByProject={allowedTrackerIdsByProject}
            />
        </div>
    );
}
