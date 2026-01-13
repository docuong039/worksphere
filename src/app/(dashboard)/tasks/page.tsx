import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TaskList } from '@/components/tasks/task-list';

export default async function TasksPage() {
    const session = await auth();

    // 1. Get dictionary of all trackers
    const trackers = await prisma.tracker.findMany({ orderBy: { position: 'asc' } });

    // 2. Compute allowed trackers per project based on permissions
    const allowedTrackerIdsByProject: Record<string, string[]> = {};

    if (session?.user?.isAdministrator) {
        const allProjects = await prisma.project.findMany({
            where: { isArchived: false },
            include: { trackers: true },
        });
        allProjects.forEach((p) => {
            // If no trackers enabled in project settings, typically means ALL are enabled (default Redmine behavior)
            // But here we might want to be strict. Let's assume empty = none, unless logic elsewhere says otherwise.
            // Actually, in `project-tracker-settings`, empty = all enabled.
            if (p.trackers.length === 0) {
                allowedTrackerIdsByProject[p.id] = trackers.map(t => t.id);
            } else {
                allowedTrackerIdsByProject[p.id] = p.trackers.map((t) => t.trackerId);
            }
        });
    } else if (session?.user) {
        const memberships = await prisma.projectMember.findMany({
            where: {
                userId: session.user.id,
                project: { isArchived: false }
            },
            include: {
                project: { include: { trackers: true } },
                role: { include: { trackers: true } },
            },
        });

        memberships.forEach((m) => {
            const projectEnabledIds = m.project.trackers.map((t) => t.trackerId);
            // If project has 0 enabled, it implies ALL are enabled
            const finalProjectIds = projectEnabledIds.length === 0
                ? trackers.map(t => t.id)
                : projectEnabledIds;

            const roleAllowedIds = m.role.trackers.map((t) => t.trackerId);

            // Intersection
            const allowed = finalProjectIds.filter((id) => roleAllowedIds.includes(id));
            allowedTrackerIdsByProject[m.project.id] = allowed;
        });
    }

    // Get other filter data
    const [statuses, priorities, projects, queries, users] = await Promise.all([
        prisma.status.findMany({ orderBy: { position: 'asc' } }),
        prisma.priority.findMany({ orderBy: { position: 'asc' } }),
        session?.user?.isAdministrator
            ? prisma.project.findMany({
                where: { isArchived: false },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, identifier: true },
            })
            : prisma.project.findMany({
                where: {
                    isArchived: false,
                    members: { some: { userId: session?.user?.id } },
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, identifier: true },
            }),
        prisma.query.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { userId: session?.user?.id },
                ],
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    // Initial tasks - my assigned, not closed
    const where = session?.user?.isAdministrator
        ? { status: { isClosed: false } }
        : {
            status: { isClosed: false },
            OR: [
                { assigneeId: session?.user?.id },
                { creatorId: session?.user?.id },
            ],
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
            _count: { select: { subtasks: true, comments: true } },
        },
    });

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Công việc</h1>
                <p className="text-gray-500 mt-1">Quản lý và theo dõi các công việc</p>
            </div>

            <TaskList
                initialTasks={tasks as any}
                trackers={trackers}
                statuses={statuses}
                priorities={priorities}
                projects={projects}
                queries={queries}
                users={users}
                currentUserId={session?.user?.id}
                allowedTrackerIdsByProject={allowedTrackerIdsByProject}
            />
        </div>
    );
}
