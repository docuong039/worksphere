import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TaskList } from '@/components/tasks/task-list';
import { notFound, redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project) notFound();

    const member = await prisma.projectMember.findFirst({
        where: { projectId: id, userId: session.user.id }
    });
    if (!session.user.isAdministrator && !member && !project.isPublic) {
        redirect('/dashboard');
    }

    const [trackers, statuses, priorities, queries] = await Promise.all([
        prisma.tracker.findMany({ orderBy: { position: 'asc' } }),
        prisma.status.findMany({ orderBy: { position: 'asc' } }),
        prisma.priority.findMany({ orderBy: { position: 'asc' } }),
        prisma.query.findMany({
            where: {
                OR: [
                    { isPublic: true, projectId: null },
                    { isPublic: true, projectId: id },
                    { userId: session.user.id, projectId: null },
                    { userId: session.user.id, projectId: id },
                ],
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    const projects = [{ id: project.id, name: project.name, identifier: project.identifier }];

    const where: Prisma.TaskWhereInput = {
        projectId: id,
        status: { isClosed: false },
    };

    const tasks = await prisma.task.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
            tracker: { select: { id: true, name: true } },
            status: { select: { id: true, name: true, isClosed: true } },
            priority: { select: { id: true, name: true, color: true } },
            project: { select: { id: true, name: true, identifier: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
            parent: { select: { id: true, number: true, title: true } },
            _count: { select: { subtasks: true, comments: true } },
        },
    });

    return (
        <TaskList
            initialTasks={tasks}
            trackers={trackers}
            statuses={statuses}
            priorities={priorities}
            projects={projects}
            queries={queries}
            currentUserId={session.user.id}
            projectId={id}
        />
    );
}
