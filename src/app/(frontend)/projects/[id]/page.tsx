import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { ProjectOverview, Status, Project, Task } from '@/components/projects/project-overview';
import { ProjectServerService } from '@/server/services/project.server';
import { TaskServerService } from '@/server/services/task.server';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
        redirect('/login');
    }

    // Check access
    const canAccess = await ProjectServerService.checkAccess(session.user, id);

    if (!canAccess) {
        notFound();
    }

    // Get project with details
    const project = await ProjectServerService.getProjectDetails(id);

    if (!project) {
        notFound();
    }

    // Get task stats by status
    const tasksByStatus = await TaskServerService.getTaskStatsByProject(id);

    // Get recent tasks
    const recentTasks = await TaskServerService.getRecentTasksByProject(id);

    return (
        <ProjectOverview
            project={project as unknown as Project}
            tasksByStatus={tasksByStatus as any}
            recentTasks={recentTasks as unknown as Task[]}
        />
    );
}
