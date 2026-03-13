import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { ProjectMembers } from '@/app/(frontend)/projects/components/ProjectMembers';
import { ProjectServerService } from '@/server/services/project.server';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectMembersPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) {
        redirect('/login');
    }

    // Check Access First using Service (Also handles if you are admin or normal project member checking validity)
    const canAccess = await ProjectServerService.checkAccess(session.user, id);

    if (!canAccess) {
        notFound();
    }

    // Get Data & Manage Control Status via Server Service Action Result Set
    const { project, roles, availableUsers } = await ProjectServerService.getMembersAndAvailableUsers(id);

    if (!project) {
        notFound();
    }

    // Call service to check valid management permission logic 
    const canManage = await ProjectServerService.canManageMembers(session.user, id);

    return (
        <ProjectMembers
            projectId={id}
            members={project.members}
            roles={roles}
            availableUsers={availableUsers}
            canManage={canManage}
            creatorId={project.creatorId}
            isAdministrator={session.user.isAdministrator}
        />
    );
}
