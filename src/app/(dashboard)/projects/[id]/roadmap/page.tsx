import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { RoadmapView } from '@/components/projects/roadmap-view';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await prisma.project.findUnique({
        where: { id },
        select: { name: true },
    });
    return {
        title: project ? `Roadmap - ${project.name} - WorkSphere` : 'Roadmap - WorkSphere',
    };
}

export default async function ProjectRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    const { id } = await params;

    const canAccess =
        session.user.isAdministrator ||
        (await prisma.projectMember.findFirst({
            where: { projectId: id, userId: session.user.id },
        }));

    if (!canAccess) {
        redirect('/dashboard');
    }

    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!project) {
        redirect('/dashboard');
    }

    const versions = await prisma.version.findMany({
        where: { projectId: id },
        include: {
            tasks: {
                include: {
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, name: true, color: true } },
                    tracker: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: [{ priority: { position: 'asc' } }, { createdAt: 'asc' }],
            },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    const roadmapVersions = versions.map((version) => {
        const totalTasks = version.tasks.length;
        const closedTasks = version.tasks.filter((t) => t.status.isClosed).length;
        const avgDoneRatio =
            totalTasks > 0
                ? Math.round(version.tasks.reduce((sum, t) => sum + t.doneRatio, 0) / totalTasks)
                : 0;

        return {
            ...version,
            dueDate: version.dueDate ? version.dueDate.toISOString() : null,
            progress: {
                total: totalTasks,
                closed: closedTasks,
                open: totalTasks - closedTasks,
                doneRatio: avgDoneRatio,
                percentage: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
            },
            tasksByStatus: {},
        };
    });

    const backlogTasks = await prisma.task.findMany({
        where: { projectId: id, versionId: null },
        include: {
            status: { select: { id: true, name: true, isClosed: true } },
            priority: { select: { id: true, name: true, color: true } },
            tracker: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const backlogCount = await prisma.task.count({
        where: { projectId: id, versionId: null },
    });

    return (
        <RoadmapView
            projectId={id}
            versions={roadmapVersions}
            backlog={{ tasks: backlogTasks, count: backlogCount }}
        />
    );
}
