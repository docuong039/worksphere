/**
 * Helper functions for projects API routes
 */
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ==========================================
// Filter Builders
// ==========================================

interface ProjectFilterParams {
    search?: string;
    status?: string | null;
    myProjects?: boolean;
    userId: string;
    isAdmin: boolean;
}

/**
 * Build Prisma where clause using search params
 */
export function buildProjectFilters(params: ProjectFilterParams): Prisma.ProjectWhereInput {
    const { search, status, myProjects, userId, isAdmin } = params;

    const where: Prisma.ProjectWhereInput = {};

    // Search filter
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { identifier: { contains: search } },
            { description: { contains: search } },
        ];
    }

    // Status filter
    if (status === 'active') {
        where.isArchived = false;
    } else if (status === 'archived') {
        where.isArchived = true;
    }

    // Non-admin or myProjects filter
    // If not admin, restrict to projects they are member of
    // If myProjects=true, restrict to projects they are member of (even if admin)
    if (!isAdmin || myProjects) {
        where.members = {
            some: { userId },
        };
    }

    return where;
}

// ==========================================
// Query Constants
// ==========================================

export const PROJECT_LIST_INCLUDE = {
    creator: {
        select: { id: true, name: true, avatar: true },
    },
    members: {
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
            role: {
                select: { id: true, name: true },
            },
        },
    },
    tasks: {
        where: {
            status: {
                isClosed: true,
            },
        },
        select: { id: true },
    },
    _count: {
        select: { tasks: true, members: true },
    },
} as const;
