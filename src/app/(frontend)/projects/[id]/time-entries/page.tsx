import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { TimeLogContent } from '@/components/TimeLogs/TimeLogContent';
import { ProjectServerService } from '@/server/services/project.server';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectTimeEntriesPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) redirect('/login');

    const canAccess = await ProjectServerService.checkAccess(session.user, id);
    if (!canAccess) notFound();

    const project = await ProjectServerService.getProjectDetails(id);
    if (!project) notFound();

    return (
        <TimeLogContent
            initialProjectId={id}
            hideHeader={true}
            titleSize="md"
        />
    );
}
