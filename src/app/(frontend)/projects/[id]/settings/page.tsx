import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProjectSettingsClient } from '@/components/projects/project-settings-client';
import { Project } from '@prisma/client';
import { PERMISSIONS } from '@/lib/constants';
import { getUserPermissions } from '@/lib/permissions';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await prisma.project.findUnique({
        where: { id },
        select: { name: true },
    });
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

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            trackers: {
                select: { trackerId: true },
            },
        },
    });

    if (!project) {
        redirect('/dashboard');
    }

    // Check permissions using the new permission system
    const permissions = await getUserPermissions(session.user.id, id);
    const canManage = session.user.isAdministrator || permissions.includes(PERMISSIONS.PROJECTS.EDIT);

    if (!canManage) {
        redirect(`/projects/${id}`);
    }

    const allTrackers = await prisma.tracker.findMany({
        orderBy: { position: 'asc' },
    });

    const enabledTrackerIds = project.trackers.map(t => t.trackerId);





    // Helper to safely access issue tracking settings
    const p = project as Project;

    return (
        <ProjectSettingsClient
            projectId={id}
            allTrackers={allTrackers}
            enabledTrackerIds={enabledTrackerIds}

            canManage={canManage}
        />
    );
}
