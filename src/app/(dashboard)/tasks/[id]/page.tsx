import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { TaskDetail } from '@/components/tasks/task-detail';
import { getSystemSettings } from '@/lib/system-settings';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) {
        redirect('/login');
    }

    // Get system settings
    const systemSettings = getSystemSettings();

    // Get task with all relations
    const isNumericId = /^\d+$/.test(id);
    const task = await prisma.task.findFirst({
        where: (isNumericId ? { number: parseInt(id) } : { id }) as any,
        include: {
            tracker: { select: { id: true, name: true } },
            status: { select: { id: true, name: true, isClosed: true } },
            priority: { select: { id: true, name: true, color: true } },
            project: {
                select: {
                    id: true,
                    name: true,
                    identifier: true,
                    members: {
                        include: {
                            user: { select: { id: true, name: true, avatar: true } },
                            role: {
                                include: {
                                    trackers: { select: { trackerId: true } }
                                }
                            },
                        },
                    },
                    trackers: { select: { trackerId: true } },
                },
            },
            version: { select: { id: true, name: true, status: true } },
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } },
            category: { select: { id: true, name: true } },
            parent: {
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: { select: { name: true, isClosed: true } },
                },
            } as any,
            subtasks: {
                select: {
                    id: true,
                    number: true,
                    title: true,
                    startDate: true,
                    dueDate: true,
                    doneRatio: true,
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, color: true } },
                    tracker: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'asc' },
            } as any,
            watchers: {
                include: {
                    user: { select: { id: true, name: true, avatar: true, email: true } },
                },
            },
            attachments: {
                include: {
                    user: { select: { id: true, name: true } }
                }
            },
            comments: {
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    }) as any;

    if (!task) {
        notFound();
    }

    // Check access
    const isMember = task.project.members.some((m: any) => m.user.id === session.user.id);
    if (!session.user.isAdministrator && !isMember) {
        notFound();
    }

    const member = task.project.members.find((m: any) => m.user.id === session.user.id);
    const allTrackers = await prisma.tracker.findMany({ orderBy: { position: 'asc' } });
    let allowedTrackers = allTrackers;

    if (!session.user.isAdministrator) {
        const projectEnabledIds = task.project.trackers.map((t: any) => t.trackerId);
        const projectAllowedIds = projectEnabledIds.length > 0 ? projectEnabledIds : allTrackers.map((t: any) => t.id);
        let roleAllowedIds = allTrackers.map((t: any) => t.id);

        if (member) {
            roleAllowedIds = member.role.trackers.map((t: any) => t.trackerId);
        }

        const validIds = projectAllowedIds.filter((id: string) => roleAllowedIds.includes(id));
        allowedTrackers = allTrackers.filter((t: any) => validIds.includes(t.id));
    } else {
        const projectEnabledIds = task.project.trackers.map((t: any) => t.trackerId);
        if (projectEnabledIds.length > 0) {
            allowedTrackers = allTrackers.filter((t: any) => projectEnabledIds.includes(t.id));
        }
    }

    const [statuses, priorities, versions, categories] = await Promise.all([
        prisma.status.findMany({ orderBy: { position: 'asc' } }),
        prisma.priority.findMany({ orderBy: { position: 'asc' } }),
        prisma.version.findMany({ where: { projectId: task.projectId }, orderBy: { name: 'asc' } }),
        prisma.issueCategory.findMany({ where: { projectId: task.projectId }, orderBy: { name: 'asc' } }),
    ]);

    const trackers = allowedTrackers;

    let allowedStatuses: { id: string; name: string; isClosed: boolean }[] = statuses.map(s => ({
        id: s.id,
        name: s.name,
        isClosed: s.isClosed,
    }));

    if (!session.user.isAdministrator) {
        const membership = task.project.members.find((m: any) => m.user.id === session.user.id);
        const transitions = await prisma.workflowTransition.findMany({
            where: {
                trackerId: task.tracker.id,
                fromStatusId: task.status.id,
                OR: [{ roleId: null }, { roleId: membership?.role.id || null }],
            },
            include: { toStatus: { select: { id: true, name: true, isClosed: true } } },
        });
        allowedStatuses = [
            { id: task.status.id, name: task.status.name, isClosed: task.status.isClosed ?? false },
            ...transitions.map((t) => ({
                id: t.toStatus.id,
                name: t.toStatus.name,
                isClosed: t.toStatus.isClosed,
            })),
        ].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
    }


    const canEdit = session.user.isAdministrator || task.creatorId === session.user.id || task.assigneeId === session.user.id;
    const canManageWatchers = session.user.isAdministrator || isMember;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-start gap-4 mb-6">
                <div className="mt-1">
                    <BackButton />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Link
                            href={`/projects/${task.project.id}`}
                            className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100 hover:bg-blue-100 transition-all"
                        >
                            {task.project.name}
                        </Link>
                        <span className="text-gray-300">/</span>
                        <div className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                            {task.tracker.name}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-mono font-bold text-gray-300">#{task.number}</span>
                        <h1 className={`text-2xl font-bold tracking-tight ${task.status.isClosed ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                            {task.title}
                        </h1>
                    </div>
                </div>
            </div>

            <TaskDetail
                task={task as any}
                trackers={trackers}
                statuses={statuses}
                priorities={priorities}
                versions={versions}
                categories={categories}
                allowedStatuses={allowedStatuses}
                canEdit={canEdit}
                currentUserId={session.user.id}
                canManageWatchers={canManageWatchers}
                systemSettings={systemSettings}
            />
        </div>
    );
}
