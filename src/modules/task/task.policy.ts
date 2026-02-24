/**
 * @file task.policy.ts
 * @description Phân quyền dựa trên thuộc tính (ABAC) cho module Task.
 * Tập trung các quy tắc kiểm tra quan hệ giữa Người dùng và Công việc.
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
    permissions?: string[]; // RBAC permissions cache
}

interface Task {
    id: string;
    projectId: string;
    creatorId: string;
    assigneeId: string | null;
    isPrivate: boolean;
}

/**
 * Kiểm tra quyền XEM công việc
 */
export function canViewTask(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Task riêng tư chỉ người tạo và người thực hiện được xem
    if (task.isPrivate) {
        return task.creatorId === user.id || task.assigneeId === user.id;
    }

    // RULE 2: Có quyền xem mọi công việc (VIEW_ALL)
    if (permissions.includes(PERMISSIONS.TASKS.VIEW_ALL)) return true;

    // RULE 3: Có quyền xem công việc trong dự án (VIEW_PROJECT)
    if (permissions.includes(PERMISSIONS.TASKS.VIEW_PROJECT)) return true;

    // RULE 4: Có quyền xem công việc được giao (VIEW_ASSIGNED) và mình là người thực hiện
    if (task.assigneeId === user.id && permissions.includes(PERMISSIONS.TASKS.VIEW_ASSIGNED)) {
        return true;
    }

    return false;
}

/**
 * Kiểm tra quyền CẬP NHẬT công việc
 */
export function canUpdateTask(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Có quyền sửa mọi công việc trong dự án (EDIT_ANY)
    if (permissions.includes(PERMISSIONS.TASKS.EDIT_ANY)) return true;

    // RULE 2: Là người thực hiện và có quyền sửa việc được giao (EDIT_ASSIGNED)
    if (task.assigneeId === user.id && permissions.includes(PERMISSIONS.TASKS.EDIT_ASSIGNED)) {
        return true;
    }

    // RULE 3: Là người tạo và có quyền sửa việc mình tạo (EDIT_OWN)
    if (task.creatorId === user.id && permissions.includes(PERMISSIONS.TASKS.EDIT_OWN)) {
        return true;
    }

    return false;
}

/**
 * Kiểm tra quyền XÓA công việc
 */
export function canDeleteTask(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Có quyền xóa bất kỳ việc gì trong dự án (DELETE_ANY)
    if (permissions.includes(PERMISSIONS.TASKS.DELETE_ANY)) return true;

    // RULE 2: Là người tạo và có quyền xóa việc mình tạo (DELETE_OWN)
    if (task.creatorId === user.id && permissions.includes(PERMISSIONS.TASKS.DELETE_OWN)) {
        return true;
    }

    // Default: Redmine thường cho phép creator xóa việc của mình nếu không có quy định khác
    if (task.creatorId === user.id) return true;

    return false;
}

/**
 * Kiểm tra quyền GIAO VIỆC cho người khác
 */
export function canAssignOthers(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.TASKS.ASSIGN_OTHERS);
}

/**
 * Kiểm tra quyền TẠO công việc
 */
export function canCreateTask(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.TASKS.CREATE);
}

/**
 * Kiểm tra quyền QUẢN LÝ người theo dõi
 * Cho phép nếu: Admin, Người tạo task, Người thực hiện task, hoặc có quyền RBAC MANAGE_WATCHERS.
 */
export function canManageWatchers(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    if (task.creatorId === user.id) return true;
    if (task.assigneeId === user.id) return true;

    return permissions.includes(PERMISSIONS.TASKS.MANAGE_WATCHERS);
}
