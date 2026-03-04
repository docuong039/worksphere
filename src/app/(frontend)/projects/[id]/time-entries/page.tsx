import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { TimeLogContent } from '@/components/time-logs/time-log-content';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectTimeEntriesPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) redirect('/login');

    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project) notFound();

    return (
        <TimeLogContent
            initialProjectId={id}
            hideHeader={true}
            titleSize="md"
        />
    );
}
