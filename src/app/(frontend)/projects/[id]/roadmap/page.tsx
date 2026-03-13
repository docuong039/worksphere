import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { RoadmapView } from '@/components/projects/roadmap-view';
import { ProjectServerService } from '@/server/services/project.server';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Metadata doesn't need to be strictly abstracted unless desired, keeping it minimal:
    const project = await ProjectServerService.getProjectDetails(id);
    return {
        title: project ? `Lộ trình - ${project.name} - WorkSphere` : 'Lộ trình - WorkSphere',
    };
}

export default async function ProjectRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    const { id } = await params;

    const canAccess = await ProjectServerService.checkAccess(session.user, id);

    if (!canAccess) {
        redirect('/dashboard');
    }

    // Using Service
    const { roadmapVersions, backlogTasks, backlogCount } = await ProjectServerService.getProjectRoadmap(id);

    return (
        <RoadmapView
            projectId={id}
            versions={roadmapVersions}
            backlog={{ tasks: backlogTasks, count: backlogCount }}
        />
    );
}
