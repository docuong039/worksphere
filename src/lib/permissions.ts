import { Role, Permission } from '@prisma/client';
import prisma from './prisma';

export interface PermissionUser {
    id: string;
    isAdministrator: boolean;
}

export type UserWithRoles = PermissionUser & {
    projectMemberships?: Array<{
        roleId: string;
        projectId: string;
        role: Role & {
            permissions: Array<{
                permission: Permission;
            }>;
        };
    }>;
};

/**
 * Check if user has a specific permission
 * @param user - User object with roles
 * @param permissionKey - Permission key (e.g., "tasks.create")
 * @param projectId - Optional project ID for project-specific permissions
 */
export async function hasPermission(
    user: PermissionUser,
    permissionKey: string,
    projectId?: string
): Promise<boolean> {
    // Administrator has all permissions
    if (user.isAdministrator) {
        return true;
    }

    // Get user's roles in the project (or all roles if no projectId)
    const memberships = await prisma.projectMember.findMany({
        where: {
            userId: user.id,
            ...(projectId ? { projectId } : {}),
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    });

    // Check if any role has the permission
    for (const membership of memberships) {
        const hasPermission = membership.role.permissions.some(
            (rp) => rp.permission.key === permissionKey
        );
        if (hasPermission) {
            return true;
        }
    }

    return false;
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
    user: PermissionUser,
    permissionKeys: string[],
    projectId?: string
): Promise<boolean> {
    if (user.isAdministrator) {
        return true;
    }

    for (const key of permissionKeys) {
        if (await hasPermission(user, key, projectId)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
    user: PermissionUser,
    permissionKeys: string[],
    projectId?: string
): Promise<boolean> {
    if (user.isAdministrator) {
        return true;
    }

    for (const key of permissionKeys) {
        if (!(await hasPermission(user, key, projectId))) {
            return false;
        }
    }

    return true;
}

/**
 * Get all permissions for a user in a project
 */
export async function getUserPermissions(
    userId: string,
    projectId?: string
): Promise<string[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return [];
    }

    if (user.isAdministrator) {
        // Return all permissions
        const allPermissions = await prisma.permission.findMany();
        return allPermissions.map((p) => p.key);
    }

    const memberships = await prisma.projectMember.findMany({
        where: {
            userId,
            ...(projectId ? { projectId } : {}),
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    });

    const permissionSet = new Set<string>();
    for (const membership of memberships) {
        for (const rp of membership.role.permissions) {
            permissionSet.add(rp.permission.key);
        }
    }

    return Array.from(permissionSet);
}

/**
 * Check if user is member of a project
 */
export async function isProjectMember(
    userId: string,
    projectId: string
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (user?.isAdministrator) {
        return true;
    }

    const membership = await prisma.projectMember.findFirst({
        where: {
            userId,
            projectId,
        },
    });

    return !!membership;
}

/**
 * Check if user can view a task
 */
export async function canViewTask(
    user: PermissionUser,
    taskId: string
): Promise<boolean> {
    if (user.isAdministrator) {
        return true;
    }

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true, assigneeId: true, creatorId: true, isPrivate: true },
    });

    if (!task) {
        return false;
    }

    // Security: Private tasks are only visible to creator, assignee, or admin
    if (task.isPrivate) {
        if (task.creatorId !== user.id && task.assigneeId !== user.id) {
            return false;
        }
    }

    // Check if user has view_all permission
    if (await hasPermission(user, 'tasks.view_all')) {
        return true;
    }

    // Check if user is project member with view_project permission
    if (await isProjectMember(user.id, task.projectId)) {
        if (await hasPermission(user, 'tasks.view_project', task.projectId)) {
            return true;
        }
    }

    // Check if user is assignee with view_assigned permission
    if (task.assigneeId === user.id) {
        if (await hasPermission(user, 'tasks.view_assigned', task.projectId)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if user can edit a task
 */
export async function canEditTask(
    user: PermissionUser,
    taskId: string
): Promise<boolean> {
    if (user.isAdministrator) {
        return true;
    }

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true, assigneeId: true, creatorId: true },
    });

    if (!task) {
        return false;
    }

    // Check if user has edit_any permission
    if (await hasPermission(user, 'tasks.edit_any', task.projectId)) {
        return true;
    }

    // Check if user is assignee with edit_assigned permission
    if (task.assigneeId === user.id) {
        if (await hasPermission(user, 'tasks.edit_assigned', task.projectId)) {
            return true;
        }
    }

    // Check if user is creator with edit_own permission
    if (task.creatorId === user.id) {
        if (await hasPermission(user, 'tasks.edit_own', task.projectId)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if workflow transition is allowed
 */
export async function canTransitionStatus(
    user: PermissionUser,
    taskId: string,
    toStatusId: string
): Promise<boolean> {
    if (user.isAdministrator) {
        return true;
    }

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { statusId: true, trackerId: true, projectId: true },
    });

    if (!task) {
        return false;
    }

    // Get user's roles in the project
    const memberships = await prisma.projectMember.findMany({
        where: {
            userId: user.id,
            projectId: task.projectId,
        },
        select: { roleId: true },
    });

    const roleIds = memberships.map((m) => m.roleId);

    // Check if transition is allowed for any of user's roles
    const allowedTransition = await prisma.workflowTransition.findFirst({
        where: {
            trackerId: task.trackerId,
            fromStatusId: task.statusId,
            toStatusId: toStatusId,
            OR: [
                { roleId: null }, // Null = all roles
                { roleId: { in: roleIds } },
            ],
        },
    });

    return !!allowedTransition;
}

/**
 * Get all project IDs where user has a specific permission
 * optimized for list filtering
 */
export async function getAccessibleProjectIds(
    userId: string,
    permissionKey: string
): Promise<string[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) return [];

    // Administrator has access to all active projects
    if (user.isAdministrator) {
        const projects = await prisma.project.findMany({
            where: { isArchived: false },
            select: { id: true }
        });
        return projects.map(p => p.id);
    }

    // Get roles that have the required permission
    const rolesWithPermission = await prisma.role.findMany({
        where: {
            permissions: {
                some: {
                    permission: {
                        key: permissionKey
                    }
                }
            },
            isActive: true
        },
        select: { id: true }
    });

    const roleIds = rolesWithPermission.map(r => r.id);

    if (roleIds.length === 0) return [];

    // Get project memberships with those roles
    const memberships = await prisma.projectMember.findMany({
        where: {
            userId,
            roleId: { in: roleIds },
            project: { isArchived: false }
        },
        select: { projectId: true }
    });

    return memberships.map(m => m.projectId);
}

/**
 * Check if user has permission in a specific project
 * Wrapper for cleaner controller code
 */
export async function checkProjectPermission(
    user: PermissionUser,
    permissionKey: string,
    projectId: string
): Promise<boolean> {
    if (user.isAdministrator) return true;

    return hasPermission(user, permissionKey, projectId);
}
