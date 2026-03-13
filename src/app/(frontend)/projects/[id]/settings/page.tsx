import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProjectSettingsClient } from '@/components/projects/project-settings-client';
import { ProjectServerService } from '@/server/services/project.server';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const project = await ProjectServerService.getProjectDetails(id);
    return {
        title: project ? `Cài đặt - ${project.name} - WorkSphere` : 'Cài đặt - WorkSphere',
    };
}

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user) {
        redirect('/login');
    }

    const { id } = await params;

    const res = await ProjectServerService.getSettingsData(session.user, id);

    if (!res) {
        redirect('/dashboard');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { project, canManage, allTrackers, enabledTrackerIds } = res;

    if (!canManage) {
        redirect(`/projects/${id}`);
    }

    return (
        <ProjectSettingsClient
            projectId={id}
            allTrackers={allTrackers as any}
            enabledTrackerIds={enabledTrackerIds}
            canManage={canManage}
        />
    );
}
