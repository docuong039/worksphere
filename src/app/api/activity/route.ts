import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import * as TaskPolicy from '@/modules/task/task.policy';
import { PERMISSIONS } from '@/lib/constants';


// GET /api/activity - Lấy activity log
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const entityType = searchParams.get('type'); // task, project, user
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    const isAdmin = user.isAdministrator;
    const currentUserId = user.id;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Filter by entityType
    if (entityType) {
        where.entityType = entityType;
    }

    // Filter by userId
    if (userId) {
        // Non-admin can only view their own activity
        if (!isAdmin && userId !== currentUserId) {
            return errorResponse('Không có quyền xem activity của người khác', 403);
        }
        where.userId = userId;
    }

    // Filter by projectId - need to check access
    if (projectId) {
        // Authorization Policy check
        const userPermissions = await getUserPermissions(user.id, projectId);
        const canView = ProjectPolicy.canViewProject(user, userPermissions);

        if (!canView) {
            return errorResponse('Không có quyền xem dự án này', 403);
        }

        // Find all tasks in project for filtering
        const projectTasks = await prisma.task.findMany({
            where: { projectId },
            select: { id: true },
        });
        const taskIds = projectTasks.map(t => t.id);

        where.OR = [
            { entityType: 'project', entityId: projectId },
            { entityType: 'task', entityId: { in: taskIds } },
        ];
    } else if (!isAdmin) {
        // Non-admin without projectId filter: show activity from their projects only
        const userProjects = await prisma.projectMember.findMany({
            where: { userId: currentUserId },
            select: { projectId: true },
        });
        const projectIds = userProjects.map(p => p.projectId);

        const projectTasks = await prisma.task.findMany({
            where: { projectId: { in: projectIds } },
            select: { id: true },
        });
        const taskIds = projectTasks.map(t => t.id);

        where.OR = [
            { entityType: 'project', entityId: { in: projectIds } },
            { entityType: 'task', entityId: { in: taskIds } },
            { userId: currentUserId },
        ];
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    // Bulk fetch entity details to avoid N+1 query
    const taskIds = activities
        .filter(a => a.entityType === 'task')
        .map(a => a.entityId);
    const projectIds = activities
        .filter(a => a.entityType === 'project')
        .map(a => a.entityId);

    const [tasksMap, projectsMap] = await Promise.all([
        taskIds.length > 0
            ? prisma.task.findMany({
                where: { id: { in: taskIds } },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    isPrivate: true,
                    creatorId: true,
                    assigneeId: true,
                    project: { select: { id: true, name: true } },
                },
            }).then(tasks => new Map(tasks.map(t => [t.id, t])))
            : Promise.resolve(new Map()),
        projectIds.length > 0
            ? prisma.project.findMany({
                where: { id: { in: projectIds } },
                select: { id: true, name: true },
            }).then(projects => new Map(projects.map(p => [p.id, p])))
            : Promise.resolve(new Map()),
    ]);

    // 1. Get unique project IDs from tasks and projects in the activity log
    const involvedProjectIds = new Set<string>();
    tasksMap.forEach(task => involvedProjectIds.add(task.project.id));
    projectsMap.forEach(proj => involvedProjectIds.add(proj.id));

    // 2. Fetch permissions for all unique projects at once
    const permissionsMap = new Map<string, string[]>();
    await Promise.all(
        Array.from(involvedProjectIds).map(async (pid) => {
            const perms = await getUserPermissions(currentUserId, pid);
            permissionsMap.set(pid, perms);
        })
    );

    // Enrich activities and filter out private tasks user cannot see
    const enrichedActivities = activities
        .map(activity => {
            let entityDetails = null;

            if (activity.entityType === 'task') {
                const task = tasksMap.get(activity.entityId);
                if (task) {
                    // Security: Hide private tasks from users who don't have access
                    const taskPermissions = permissionsMap.get(task.project.id) || [];
                    if (!TaskPolicy.canViewTask(user, task as any, taskPermissions)) {
                        return null; // Filter out this activity
                    }

                    entityDetails = {
                        id: task.id,
                        number: task.number,
                        title: task.title,
                        project: task.project,
                    };
                }
            } else if (activity.entityType === 'project') {
                const project = projectsMap.get(activity.entityId);
                if (project) {
                    const projectPermissions = permissionsMap.get(project.id) || [];
                    if (!ProjectPolicy.canViewProject(user, projectPermissions)) {
                        return null;
                    }
                    entityDetails = project;
                }
            }

            return {
                ...activity,
                entityDetails,
            };
        })
        .filter(Boolean); // Remove null entries (filtered items)


    return successResponse({
        activities: enrichedActivities,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});
