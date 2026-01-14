import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ProjectOverview, Status, Project, Task } from '@/components/projects/project-overview';

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
    const canAccess =
        session.user.isAdministrator ||
        (await prisma.projectMember.findFirst({
            where: { userId: session.user.id, projectId: id },
        }));

    if (!canAccess) {
        notFound();
    }

    // Get project with details
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            creator: {
                select: { id: true, name: true, email: true, avatar: true },
            },
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                    role: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
            _count: {
                select: { tasks: true, members: true },
            },
        },
    });

    if (!project) {
        notFound();
    }

    // Get task stats by status
    const statuses = await prisma.status.findMany({ orderBy: { position: 'asc' } });
    const taskStats = await prisma.task.groupBy({
        by: ['statusId'],
        where: { projectId: id },
        _count: { id: true },
    });

    const tasksByStatus = statuses.map((status) => ({
        status: status as Status,
        count: taskStats.find((ts) => ts.statusId === status.id)?._count.id || 0,
    }));

    // Get recent tasks
    const recentTasks = await prisma.task.findMany({
        where: { projectId: id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
            status: { select: { id: true, name: true, isClosed: true } },
            priority: { select: { id: true, name: true, color: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
        },
    });


    return (
        <ProjectOverview
            project={project as unknown as Project}
            tasksByStatus={tasksByStatus}
            recentTasks={recentTasks as unknown as Task[]}
        />
    );
}
