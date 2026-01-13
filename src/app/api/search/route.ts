import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/search - Global Search
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type'); // tasks, projects, comments, users, all

        if (!query || query.trim().length < 2) {
            return errorResponse('Query phải có ít nhất 2 ký tự', 400);
        }

        const searchQuery = query.trim();
        const isAdmin = session.user.isAdministrator;
        const userId = session.user.id;

        // Project filter for non-admin users
        const projectFilter = isAdmin
            ? {}
            : { members: { some: { userId } } };

        const results: {
            tasks: unknown[];
            projects: unknown[];
            comments: unknown[];
            users: unknown[];
        } = {
            tasks: [],
            projects: [],
            comments: [],
            users: [],
        };

        // Search Tasks
        if (!type || type === 'all' || type === 'tasks') {
            results.tasks = await prisma.task.findMany({
                where: {
                    OR: [
                        { title: { contains: searchQuery } },
                        { description: { contains: searchQuery } },
                    ],
                    project: projectFilter,
                },
                select: {
                    id: true,
                    title: true,
                    status: { select: { name: true, isClosed: true } },
                    priority: { select: { name: true, color: true } },
                    project: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true } },
                },
                take: 20,
                orderBy: { updatedAt: 'desc' },
            });
        }

        // Search Projects
        if (!type || type === 'all' || type === 'projects') {
            results.projects = await prisma.project.findMany({
                where: {
                    OR: [
                        { name: { contains: searchQuery } },
                        { identifier: { contains: searchQuery } },
                        { description: { contains: searchQuery } },
                    ],
                    ...projectFilter,
                    isArchived: false,
                },
                select: {
                    id: true,
                    name: true,
                    identifier: true,
                    description: true,
                    _count: { select: { tasks: true, members: true } },
                },
                take: 10,
            });
        }

        // Search Comments
        if (!type || type === 'all' || type === 'comments') {
            results.comments = await prisma.comment.findMany({
                where: {
                    content: { contains: searchQuery },
                    task: { project: projectFilter },
                },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: { select: { id: true, name: true } },
                    task: { select: { id: true, title: true } },
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        }

        // Search Users (Admin only for full search, others see project members)
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
                    take: 10,
                });
                // Deduplicate users
                const uniqueUsers = new Map();
                projectMembers.forEach((pm) => {
                    if (!uniqueUsers.has(pm.user.id)) {
                        uniqueUsers.set(pm.user.id, pm.user);
                    }
                });
                results.users = Array.from(uniqueUsers.values());
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
    } catch (error) {
        return handleApiError(error);
    }
}
