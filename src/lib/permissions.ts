/**
 * @file permissions.ts
 * @description "Bộ não" kiểm tra quyền hạn (Role-based Access Control).
 * Chứa logic kiểm tra xem người dùng có đủ quyền để thực hiện các thao tác (Xem, Sửa, Xóa) trên Project hoặc Task.
 */
import prisma from '@/lib/prisma';

export interface PermissionUser {
    id: string;
    isAdministrator: boolean;
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
        return allPermissions.map((p: any) => p.key);
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
    for (const membership of memberships as any[]) {
        for (const rp of membership.role.permissions as any[]) {
            permissionSet.add(rp.permission.key);
        }
    }

    return Array.from(permissionSet);
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

    const roleIds = memberships.map((m: any) => m.roleId);

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
    permissionKey: string | string[]
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
        return projects.map((p: { id: string }) => p.id);
    }

    // Get roles that have the required permission
    const rolesWithPermission = await prisma.role.findMany({
        where: {
            permissions: {
                some: {
                    permission: {
                        key: { in: Array.isArray(permissionKey) ? permissionKey : [permissionKey] }
                    }
                }
            },
            isActive: true
        },
        select: { id: true }
    });

    const roleIds = rolesWithPermission.map((r: any) => r.id);

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

    return memberships.map((m: { projectId: string }) => m.projectId);
}

/**
 * Trả về map projectId → [permission keys] cho user.
 * Dùng ở trang Export để tính đúng scope theo từng dự án,
 * thay vì union toàn bộ memberships gây "lọt quyền" sang project khác.
 */
export async function getProjectPermissionsMap(
    userId: string
): Promise<Record<string, string[]>> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return {};

    if (user.isAdministrator) {
        const [allPermissions, projects] = await Promise.all([
            prisma.permission.findMany({ select: { key: true } }),
            prisma.project.findMany({ select: { id: true } }),
        ]);
        const allKeys = allPermissions.map((p: any) => p.key);
        const map: Record<string, string[]> = {};
        projects.forEach((p: any) => { map[p.id] = allKeys; });
        return map;
    }

    const memberships = await prisma.projectMember.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    permissions: { include: { permission: true } },
                },
            },
        },
    });

    const map: Record<string, string[]> = {};
    for (const m of memberships as any[]) {
        if (!map[m.projectId]) map[m.projectId] = [];
        for (const rp of m.role.permissions as any[]) {
            if (!map[m.projectId].includes(rp.permission.key)) {
                map[m.projectId].push(rp.permission.key);
            }
        }
    }
    return map;
}
