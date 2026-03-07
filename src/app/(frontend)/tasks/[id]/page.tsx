import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { TaskDetail } from '@/components/tasks/task-detail';
import { TaskWithRelations } from '@/types';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';


interface Props {
    params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) {
        redirect('/login');
    }



    // Get task with all relations
    const isNumericId = /^\d+$/.test(id);
    const task = await prisma.task.findFirst({
        where: (isNumericId ? { number: parseInt(id) } : { id }),
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
                        where: {
                            user: { isAdministrator: false }, // Ẩn admin khỏi dropdown gán task
                        },
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
            parent: {
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: { select: { name: true, isClosed: true } },
                },
            },
            subtasks: {
                select: {
                    id: true,
                    number: true,
                    title: true,
                    startDate: true,
                    dueDate: true,
                    doneRatio: true,
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, name: true, color: true } },
                    tracker: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                    timeLogs: { select: { hours: true } }, // Bottom-Up: cộng giờ thực tế lên task cha
                },
                orderBy: { createdAt: 'asc' },
            },
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
            timeLogs: {
                include: {
                    user: { select: { id: true, name: true } },
                    activity: { select: { id: true, name: true } },
                },
                orderBy: { spentOn: 'desc' },
            },
        },
    });

    if (!task) {
        notFound();
    }

    // Check access
    const isMember = task.project.members.some(m => m.user.id === session.user.id);
    if (!session.user.isAdministrator && !isMember) {
        notFound();
    }

    const member = task.project.members.find(m => m.user.id === session.user.id);
    const allTrackers = await prisma.tracker.findMany({ orderBy: { position: 'asc' } });
    let allowedTrackers = allTrackers;

    if (!session.user.isAdministrator) {
        const projectEnabledIds = task.project.trackers.map(t => t.trackerId);
        const projectAllowedIds = projectEnabledIds.length > 0 ? projectEnabledIds : allTrackers.map(t => t.id);
        let roleAllowedIds = allTrackers.map(t => t.id);

        if (member) {
            roleAllowedIds = member.role.trackers.map(t => t.trackerId);
        }

        const validIds = projectAllowedIds.filter((id: string) => roleAllowedIds.includes(id));
        allowedTrackers = allTrackers.filter(t => validIds.includes(t.id));
    } else {
        const projectEnabledIds = task.project.trackers.map(t => t.trackerId);
        if (projectEnabledIds.length > 0) {
            allowedTrackers = allTrackers.filter(t => projectEnabledIds.includes(t.id));
        }
    }

    const [statuses, priorities, versions] = await Promise.all([
        prisma.status.findMany({ orderBy: { position: 'asc' } }),
        prisma.priority.findMany({ orderBy: { position: 'asc' } }),
        prisma.version.findMany({ where: { projectId: task.projectId }, orderBy: { name: 'asc' } }),
    ]);

    const trackers = allowedTrackers;

    let allowedStatuses: { id: string; name: string; isClosed: boolean }[] = statuses.map(s => ({
        id: s.id,
        name: s.name,
        isClosed: s.isClosed,
    }));

    if (!session.user.isAdministrator) {
        const membership = task.project.members.find(m => m.user.id === session.user.id);
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


    // RBAC Authorization Check
    const userPermissions = await getUserPermissions(session.user.id, task.projectId);
    const canEdit = TaskPolicy.canUpdateTask(session.user, task, userPermissions);
    const canFullEdit = TaskPolicy.canFullyEditTask(session.user, task, userPermissions);
    const canManageWatchers = TaskPolicy.canManageWatchers(session.user, task, userPermissions);
    const canAssignOthers = TaskPolicy.canAssignOthers(session.user, userPermissions);

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
                        <span className="text-gray-500">/</span>
                        <div className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                            {task.tracker.name}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-mono font-bold text-gray-500">#{task.number}</span>
                        <h1 className={`text-2xl font-bold tracking-tight ${task.status.isClosed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.title}
                        </h1>
                    </div>
                </div>
            </div>

            <TaskDetail
                task={task as unknown as TaskWithRelations}
                trackers={trackers}
                statuses={statuses}
                priorities={priorities}
                versions={versions}
                allowedStatuses={allowedStatuses as unknown as any[]}
                canEdit={canEdit}
                canFullEdit={canFullEdit}
                canAssignOthers={canAssignOthers}
                currentUserId={session.user.id}
                allowedTrackerIds={trackers.map(t => t.id)}
                canManageWatchers={canManageWatchers}
            />
        </div>
    );
}
