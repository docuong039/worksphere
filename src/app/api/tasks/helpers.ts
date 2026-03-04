/**
 * Helper functions for tasks API routes
 * Extracted to keep route.ts clean and maintainable
 */

import { Prisma } from '@prisma/client';

// ==========================================
// Filter Builders
// ==========================================

interface TaskFilterParams {
    projectIds: string[];
    userId: string;
    isAdmin: boolean;
    searchParams: URLSearchParams;
    projectPermissionsMap?: Record<string, string[]>;
}

/**
 * Build Prisma where clause from search params
 */
export function buildTaskFilters(params: TaskFilterParams): Prisma.TaskWhereInput {
    const { projectIds, userId, isAdmin, searchParams, projectPermissionsMap } = params;

    const where: Prisma.TaskWhereInput = {};

    // Security: Filter private tasks and project task visibility
    if (isAdmin) {
        where.projectId = { in: projectIds };
    } else {
        const projectOrConditions: Prisma.TaskWhereInput[] = [];

        for (const pid of projectIds) {
            const perms = projectPermissionsMap?.[pid] || [];
            if (perms.length === 0) continue;

            const canViewAll = perms.includes('tasks.view_all') || perms.includes('tasks.view_project');
            const canViewAssigned = perms.includes('tasks.view_assigned');

            if (!canViewAll && !canViewAssigned && searchParams.get('my') !== 'true') continue;

            if (canViewAll) {
                projectOrConditions.push({
                    projectId: pid,
                    OR: [
                        { isPrivate: false },
                        { isPrivate: true, creatorId: userId },
                        { isPrivate: true, assigneeId: userId },
                    ]
                });
            } else if (canViewAssigned || searchParams.get('my') === 'true') {
                projectOrConditions.push({
                    projectId: pid,
                    OR: [
                        { assigneeId: userId },
                        { creatorId: userId },
                    ]
                });
            }
        }

        if (projectOrConditions.length === 0) {
            return { id: 'no-access-forced-empty' };
        } else {
            where.OR = projectOrConditions;
        }
    }

    // Standard Filters
    if (searchParams.get('statusId')) where.statusId = searchParams.get('statusId')!;
    if (searchParams.get('priorityId')) where.priorityId = searchParams.get('priorityId')!;
    if (searchParams.get('trackerId')) where.trackerId = searchParams.get('trackerId')!;
    if (searchParams.get('assigneeId')) where.assigneeId = searchParams.get('assigneeId')!;
    if (searchParams.get('creatorId')) where.creatorId = searchParams.get('creatorId')!;

    // Version Filter
    const versionId = searchParams.get('versionId');
    if (versionId === 'null') where.versionId = null;
    else if (versionId) where.versionId = versionId;

    // Parent Filter
    const parentId = searchParams.get('parentId');
    if (parentId === 'null') where.parentId = null;
    else if (parentId) where.parentId = parentId;

    // Closed Status Filter
    const isClosed = searchParams.get('isClosed');
    if (isClosed === 'true') where.status = { isClosed: true };
    else if (isClosed === 'false') where.status = { isClosed: false };

    // "My Tasks" Quick Filters
    if (searchParams.get('my') === 'true') {
        where.AND = { OR: [{ assigneeId: userId }, { creatorId: userId }] };
    } else if (searchParams.get('assignedToMe') === 'true') {
        where.assigneeId = userId;
    } else if (searchParams.get('createdByMe') === 'true') {
        where.creatorId = userId;
    }

    // Text Search
    const search = searchParams.get('search');
    if (search) {
        const searchCondition = {
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
            ],
        };
        if (where.AND) {
            where.AND = [where.AND as Prisma.TaskWhereInput, searchCondition];
        } else {
            where.AND = searchCondition;
        }
    }

    // Date Range Filters
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');
    if (startDateFrom || startDateTo) {
        where.startDate = {};
        if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
        if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    const dueDateFrom = searchParams.get('dueDateFrom');
    const dueDateTo = searchParams.get('dueDateTo');
    if (dueDateFrom || dueDateTo) {
        where.dueDate = {};
        if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
        if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
    }

    return where;
}

// ==========================================
// Query Constants
// ==========================================

/**
 * Standard include for task list queries
 */
export const TASK_LIST_INCLUDE = {
    tracker: { select: { id: true, name: true } },
    status: { select: { id: true, name: true, isClosed: true } },
    priority: { select: { id: true, name: true, color: true } },
    project: { select: { id: true, name: true, identifier: true } },
    assignee: { select: { id: true, name: true, avatar: true } },
    creator: { select: { id: true, name: true } },
    version: { select: { id: true, name: true, status: true } },
    subtasks: {
        include: {
            status: { select: { id: true, name: true, isClosed: true } },
            assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { updatedAt: 'desc' as const },
    },
    attachments: {
        include: {
            user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' as const },
    },
    _count: { select: { subtasks: true, comments: true } },
} as const;

/**
 * Parse pagination params from search params
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
    return {
        page: Math.max(1, parseInt(searchParams.get('page') || '1')),
        pageSize: Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '50'))),
        sortBy: searchParams.get('sortBy') || 'updatedAt',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };
}
