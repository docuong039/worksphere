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

    // RULE 5: Luôn cho phép người tạo (creator) xem công việc của chính mình
    if (task.creatorId === user.id) {
        return true;
    }

    return false;
}

/**
 * Kiểm tra quyền CẬP NHẬT công việc (bao gồm cả cập nhật trạng thái giới hạn)
 * → Dùng để xác định có hiện nút "Chỉnh sửa" hay không
 */
export function canUpdateTask(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    if (permissions.includes(PERMISSIONS.TASKS.EDIT_ANY)) return true;
    if (task.creatorId === user.id && permissions.includes(PERMISSIONS.TASKS.EDIT_OWN)) return true;

    // Người được giao: chỉ được cập nhật trạng thái + % hoàn thành (không phải toàn quyền)
    if (task.assigneeId === user.id && permissions.includes(PERMISSIONS.TASKS.EDIT_ASSIGNED)) {
        return true;
    }

    return false;
}

/**
 * Kiểm tra quyền CHỈNH SỬA ĐẦY ĐỦ (tất cả các trường: tiêu đề, deadline, mô tả, ưu tiên...)
 * → Dùng để quyết định có cho phép sửa toàn bộ form hay chỉ cập nhật trạng thái
 */
export function canFullyEditTask(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    if (permissions.includes(PERMISSIONS.TASKS.EDIT_ANY)) return true;

    // Chỉ người TẠO task mới được sửa đầy đủ (tiêu đề, deadline, mô tả...)
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
 * Chỉ cho phép Admin hoặc người có quyền RBAC MANAGE_WATCHERS được thêm/xóa người theo dõi.
 */
export function canManageWatchers(user: User, task: Task, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.TASKS.MANAGE_WATCHERS);
}
