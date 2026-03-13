import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { VersionsManager } from '@/app/(frontend)/projects/components/VersionsManager';
import { ProjectServerService } from '@/server/services/project.server';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectVersionsPage({ params }: PageProps) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const { id } = await params;

    const canAccess = await ProjectServerService.checkAccess(session.user, id);

    if (!canAccess) {
        redirect('/dashboard');
    }

    const res = await ProjectServerService.getProjectVersionsData(session.user, id);

    if (!res) {
        notFound();
    }

    const { project, versionsWithProgress, canManage } = res;

    return (
        <VersionsManager
            projectId={project.id}
            versions={versionsWithProgress}
            canManage={canManage}
        />
    );
}
