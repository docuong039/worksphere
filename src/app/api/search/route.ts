import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';
import * as TaskPolicy from '@/server/policies/task.policy';


// GET /api/search - Global Search
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // tasks, projects, comments, users, all

    if (!query || query.trim().length < 2) {
        return errorResponse('Query phải có ít nhất 2 ký tự', 400);
    }

    const searchQuery = query.trim();
    const isAdmin = user.isAdministrator;
    const userId = user.id;

    // 1. Load context-independent data
    const results: {
        tasks: any[];
        projects: any[];
        comments: any[];
        users: any[];
    } = {
        tasks: [],
        projects: [],
        comments: [],
        users: [],
    };

    // Helper: Bulk fetch project permissions
    const permissionsMap = new Map<string, string[]>();
    const getCachedPermissions = async (projectId: string) => {
        if (!permissionsMap.has(projectId)) {
            const perms = await getUserPermissions(userId, projectId);
            permissionsMap.set(projectId, perms);
        }
        return permissionsMap.get(projectId) || [];
    };

    // SEARCH TASKS
    if (!type || type === 'all' || type === 'tasks') {
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { title: { contains: searchQuery } },
                    { description: { contains: searchQuery } },
                ],
                // Base filter: must be in a project user is a member of (unless admin)
                project: isAdmin ? {} : { members: { some: { userId } } },
            },
            include: {
                status: { select: { name: true, isClosed: true } },
                priority: { select: { name: true, color: true } },
                project: { select: { id: true, name: true, creatorId: true, isArchived: true } },
                assignee: { select: { id: true, name: true } },
            },
            take: 50, // Fetch more to allow for filtering
            orderBy: { updatedAt: 'desc' },
        });

        // Apply Policy Filter
        for (const task of tasks) {
            const perms = await getCachedPermissions(task.projectId);
            if (TaskPolicy.canViewTask(user, task as any, perms)) {
                results.tasks.push({
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    project: { id: task.project.id, name: task.project.name },
                    assignee: task.assignee,
                });
            }
            if (results.tasks.length >= 20) break;
        }
    }

    // SEARCH PROJECTS
    if (!type || type === 'all' || type === 'projects') {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { name: { contains: searchQuery } },
                    { identifier: { contains: searchQuery } },
                    { description: { contains: searchQuery } },
                ],
                isArchived: false,
                members: isAdmin ? {} : { some: { userId } },
            },
            select: {
                id: true,
                name: true,
                identifier: true,
                description: true,
                creatorId: true,
                isArchived: true,
                _count: { select: { tasks: true, members: true } },
            },
            take: 20,
        });

        for (const project of projects) {
            const perms = await getCachedPermissions(project.id);
            if (ProjectPolicy.canViewProject(user, perms)) {
                results.projects.push(project);
            }
            if (results.projects.length >= 10) break;
        }
    }

    // SEARCH COMMENTS
    if (!type || type === 'all' || type === 'comments') {
        const comments = await prisma.comment.findMany({
            where: {
                content: { contains: searchQuery },
                task: { project: isAdmin ? {} : { members: { some: { userId } } } },
            },
            include: {
                user: { select: { id: true, name: true } },
                task: {
                    select: {
                        id: true,
                        title: true,
                        isPrivate: true,
                        creatorId: true,
                        assigneeId: true,
                        projectId: true
                    }
                },
            },
            take: 30,
            orderBy: { createdAt: 'desc' },
        });

        for (const comment of comments) {
            const perms = await getCachedPermissions(comment.task.projectId);
            if (TaskPolicy.canViewTask(user, comment.task as any, perms)) {
                results.comments.push({
                    id: comment.id,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    user: comment.user,
                    task: { id: comment.task.id, title: comment.task.title },
                });
            }
            if (results.comments.length >= 10) break;
        }
    }

    // SEARCH USERS
    if (!type || type === 'all' || type === 'users') {
        if (isAdmin) {
            results.users = await prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: searchQuery } },
                        { email: { contains: searchQuery } },
                    ],
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    isAdministrator: true,
                },
                take: 10,
            });
        } else {
            // Non-admin: only search users in same projects
            const projectMembers = await prisma.projectMember.findMany({
                where: {
                    project: { members: { some: { userId } } },
                    user: {
                        OR: [
                            { name: { contains: searchQuery } },
                            { email: { contains: searchQuery } },
                        ],
                        isActive: true,
                    },
                },
                select: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
                take: 50,
            });
            const uniqueUsers = new Map();
            projectMembers.forEach((pm) => {
                if (!uniqueUsers.has(pm.user.id)) {
                    uniqueUsers.set(pm.user.id, pm.user);
                }
            });
            results.users = Array.from(uniqueUsers.values()).slice(0, 10);
        }
    }

    return successResponse({
        query: searchQuery,
        results,
        counts: {
            tasks: results.tasks.length,
            projects: results.projects.length,
            comments: results.comments.length,
            users: results.users.length,
        },
    });

});
