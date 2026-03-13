/**
 * @file project.policy.ts
 * @description Phân quyền dựa trên thuộc tính (ABAC) cho module Project.
 * Tập trung các quy tắc kiểm tra quan hệ giữa Người dùng và Dự án.
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface Project {
    id: string;
    creatorId: string;
    isArchived: boolean;
}

/**
 * Kiểm tra quyền TẠO dự án (Global)
 */
export function canCreateProject(user: User, globalPermissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return globalPermissions.includes(PERMISSIONS.PROJECTS.CREATE);
}

/**
 * Kiểm tra quyền XEM dự án

 * Mọi thành viên trong dự án hoặc Admin đều được xem.
 * (RBAC đã check membership qua getUserPermissions, nếu permissions empty [] thì không có quyền)
 */
export function canViewProject(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // Nếu có ít nhất 1 permission trong project thì có nghĩa là member -> được xem nội dung cơ bản
    return permissions.length > 0;
}

/**
 * Kiểm tra quyền CẬP NHẬT dự án (Settings, Name, Description)
 */
export function canUpdateProject(user: User, project: Project, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE: Có quyền EDIT dự án
    if (permissions.includes(PERMISSIONS.PROJECTS.EDIT)) return true;

    // RULE: Người tạo dự án (thường là Manager mặc định)
    if (project.creatorId === user.id) return true;

    return false;
}

/**
 * Kiểm tra quyền XÓA dự án
 */
export function canDeleteProject(user: User, project: Project, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE: Phải có quyền DELETE dự án
    if (permissions.includes(PERMISSIONS.PROJECTS.DELETE)) return true;

    // Thường thì chỉ Admin hoặc Owner/Creator mới được xóa project
    return project.creatorId === user.id && permissions.includes(PERMISSIONS.PROJECTS.DELETE);
}

/**
 * Kiểm tra quyền QUẢN LÝ THÀNH VIÊN
 */
export function canManageMembers(user: User, project: Project, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    if (project.creatorId === user.id) return true;
    return permissions.includes(PERMISSIONS.PROJECTS.MANAGE_MEMBERS);
}

/**
 * Kiểm tra quyền LƯU TRỮ (Archive/Unarchive)
 */
export function canArchiveProject(user: User, project: Project, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    return project.creatorId === user.id || permissions.includes(PERMISSIONS.PROJECTS.ARCHIVE);
}

/**
 * Kiểm tra quyền QUẢN LÝ PHIÊN BẢN (Versions/Roadmap)
 */
export function canManageVersions(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.PROJECTS.MANAGE_VERSIONS);
}

/**
 * Kiểm tra quyền QUẢN LÝ LOẠI CÔNG VIỆC (Trackers)
 */
export function canManageTrackers(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.PROJECTS.MANAGE_TRACKERS);
}

