/**
 * @file dashboard.policy.ts
 * @description Phân quyền và xác định chế độ hiển thị cho Dashboard.
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface ProjectMember {
    userId: string;
    role: {
        permissions: {
            permission: {
                key: string;
            }
        }[]
    }
}

interface ProjectBrief {
    id: string;
    name?: string;
    creatorId: string;
    creator?: { name: string };
    endDate?: Date | null;
    tasks?: any[];
    _count?: { tasks: number; members: number };
    members: ProjectMember[];
}

/**
 * Xác định xem một dự án cụ thể người dùng có quyền quản trị hay không
 */
export function isProjectManager(user: User, project: ProjectBrief): boolean {
    if (user.isAdministrator) return true;
    if (project.creatorId === user.id) return true;

    return project.members.some(m =>
        m.userId === user.id &&
        m.role.permissions.some(rp => rp.permission.key === PERMISSIONS.PROJECTS.EDIT)
    );
}

/**
 * Xác định xem người dùng có nên thấy "Giao diện quản lý" (Management View) trên Dashboard hay không.
 * Trả về true nếu là Admin hoặc là Manager của ít nhất một dự án.
 */
export function shouldShowManagementView(user: User, projects: ProjectBrief[]): boolean {
    if (user.isAdministrator) return true;
    return projects.some(p => isProjectManager(user, p));
}

/**
 * Lọc danh sách dự án mà người dùng có quyền quản trị để hiển thị trong khu vực "Sức khỏe dự án"
 */
export function filterManagedProjects(user: User, projects: ProjectBrief[]): ProjectBrief[] {
    if (user.isAdministrator) return projects;
    return projects.filter(p => isProjectManager(user, p));
}
