import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProjectSettingsClient } from '@/components/projects/project-settings-client';
import { Project } from '@prisma/client';

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

    // Check permissions
    const member = await prisma.projectMember.findFirst({
        where: { projectId: id, userId: session.user.id },
        include: { role: true },
    });

    if (!session.user.isAdministrator && !member) {
        redirect('/dashboard');
    }

    const canManage = session.user.isAdministrator || (member?.role.name === 'Manager' || member?.role.name === 'Quản lý');

    if (!canManage) {
        redirect(`/projects/${id}`);
    }

    const allTrackers = await prisma.tracker.findMany({
        orderBy: { position: 'asc' },
    });

    const enabledTrackerIds = project.trackers.map(t => t.trackerId);



    const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { user: { name: 'asc' } },
    });

    // Helper to safely access issue tracking settings
    const p = project as Project;

    return (
        <ProjectSettingsClient
            projectId={id}
            allTrackers={allTrackers}
            enabledTrackerIds={enabledTrackerIds}
            project={p}

            members={members.map(m => ({
                userId: m.userId,
                user: m.user
            }))}
            issueSettings={{
                parentIssueDates: p.parentIssueDates,
                parentIssuePriority: p.parentIssuePriority,
                parentIssueDoneRatio: p.parentIssueDoneRatio,
                parentIssueEstimatedHours: p.parentIssueEstimatedHours,
            }}
            canManage={canManage}
        />
    );
}
