import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { VersionsManager } from '@/components/projects/versions-manager';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectVersionsPage({ params }: PageProps) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            identifier: true,
        },
    });

    if (!project) {
        notFound();
    }

    const canAccess =
        session.user.isAdministrator ||
        (await prisma.projectMember.findFirst({
            where: { userId: session.user.id, projectId: id },
        }));

    if (!canAccess) {
        redirect('/dashboard');
    }

    const versions = await prisma.version.findMany({
        where: { projectId: id },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        include: {
            _count: { select: { tasks: true } },
        },
    });

    const versionsWithProgress = await Promise.all(
        versions.map(async (version) => {
            const tasks = await prisma.task.findMany({
                where: { versionId: version.id },
                select: {
                    status: { select: { isClosed: true } },
                },
            });

            const totalTasks = tasks.length;
            const closedTasks = tasks.filter((t) => t.status.isClosed).length;
            const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

            return {
                ...version,
                totalTasks,
                closedTasks,
                progress,
            };
        })
    );

    const canManage =
        session.user.isAdministrator ||
        !!(await prisma.projectMember.findFirst({
            where: {
                userId: session.user.id,
                projectId: id,
                role: {
                    permissions: {
                        some: {
                            permission: { key: 'projects.manage_versions' },
                        },
                    },
                },
            },
        }));

    return (
        <VersionsManager
            projectId={project.id}
            versions={versionsWithProgress}
            canManage={canManage}
        />
    );
}
