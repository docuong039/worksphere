import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';


// GET /api/projects/[id]/roadmap - Get roadmap view (tasks grouped by version)
export const GET = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const trackerId = searchParams.get('trackerId');

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập lộ trình dự án này', 403);
    }


    // Get versions with their tasks
    const versions = await prisma.version.findMany({
        where: {
            projectId: id,
            ...(includeCompleted ? {} : { status: { not: 'closed' } }),
        },
        include: {
            tasks: {
                where: {
                    ...(trackerId ? { trackerId } : {}),
                },
                include: {
                    status: { select: { id: true, name: true, isClosed: true } },
                    priority: { select: { id: true, name: true, color: true } },
                    tracker: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: [
                    { priority: { position: 'asc' } },
                    { createdAt: 'asc' },
                ],
            },
        },
        orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
        ],
    });

    // Calculate progress for each version
    const roadmap = versions.map(version => {
        const totalTasks = version.tasks.length;
        const closedTasks = version.tasks.filter(t => t.status.isClosed).length;
        const openTasks = totalTasks - closedTasks;

        // Calculate completion percentage
        const avgDoneRatio = totalTasks > 0
            ? Math.round(version.tasks.reduce((sum, t) => sum + t.doneRatio, 0) / totalTasks)
            : 0;

        // Group tasks by status
        const tasksByStatus = version.tasks.reduce((acc, task) => {
            const statusName = task.status.name;
            if (!acc[statusName]) {
                acc[statusName] = [];
            }
            acc[statusName].push(task);
            return acc;
        }, {} as Record<string, typeof version.tasks>);

        return {
            ...version,
            progress: {
                total: totalTasks,
                closed: closedTasks,
                open: openTasks,
                doneRatio: avgDoneRatio,
                percentage: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
            },
            tasksByStatus,
        };
    });

    // Get tasks without version (backlog)
    const backlogTasks = await prisma.task.findMany({
        where: {
            projectId: id,
            versionId: null,
            ...(trackerId ? { trackerId } : {}),
        },
        include: {
            status: { select: { id: true, name: true, isClosed: true } },
            priority: { select: { id: true, name: true, color: true } },
            tracker: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [
            { priority: { position: 'asc' } },
            { createdAt: 'asc' },
        ],
        take: 50,
    });

    return successResponse({
        versions: roadmap,
        backlog: {
            tasks: backlogTasks,
            count: backlogTasks.length,
        },
    });
});
