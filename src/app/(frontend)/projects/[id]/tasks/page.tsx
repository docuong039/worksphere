import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TaskList } from '@/components/tasks/task-list';
import { TaskWithRelations, SavedQueryWithRelations } from '@/types';
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

    const [allTrackers, statuses, priorities, queries, projectData] = await Promise.all([
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
        prisma.project.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true } }
                    }
                },
                trackers: {
                    include: {
                        tracker: true
                    }
                }
            }
        })
    ]);

    const users = projectData?.members.map(m => m.user) || [];

    // Filter trackers: Use project-specific trackers if defined, otherwise use all
    let trackers = allTrackers;
    if (projectData && projectData.trackers.length > 0) {
        // Sort by position (inherited from tracker model manually since we can't sort easy in include deep)
        trackers = projectData.trackers.map(pt => pt.tracker).sort((a, b) => a.position - b.position);
    }

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
            initialTasks={tasks as unknown as TaskWithRelations[]}
            trackers={trackers}
            statuses={statuses}
            priorities={priorities}
            projects={projects}
            queries={queries as unknown as SavedQueryWithRelations[]}
            users={users}
            currentUserId={session.user.id}
            projectId={id}
        />
    );
}
