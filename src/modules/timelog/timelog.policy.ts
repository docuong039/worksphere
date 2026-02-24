/**
 * @file timelog.policy.ts
 * @description Phân quyền dựa trên thuộc tính (ABAC) cho module TimeLog.
 * Tập trung các quy tắc kiểm tra quan hệ giữa Người dùng và Nhật ký thời gian.
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface TimeLog {
    id: string;
    userId: string; // Creator of the log
    projectId: string;
}

/**
 * Kiểm tra quyền XEM nhật ký thời gian
 */
export function canViewTimeLog(user: User, timeLog: TimeLog, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Có quyền xem tất cả nhật ký thời gian (VIEW_ALL)
    if (permissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL)) return true;

    // RULE 2: Là người tạo và có quyền xem nhật ký của chính mình (VIEW_OWN)
    if (timeLog.userId === user.id && permissions.includes(PERMISSIONS.TIMELOGS.VIEW_OWN)) {
        return true;
    }

    return false;
}

/**
 * Kiểm tra quyền CẬP NHẬT nhật ký thời gian
 */
export function canUpdateTimeLog(user: User, timeLog: TimeLog, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Có quyền sửa tất cả (EDIT_ALL)
    if (permissions.includes(PERMISSIONS.TIMELOGS.EDIT_ALL)) return true;

    // RULE 2: Là người tạo và có quyền sửa nhật ký của mình (EDIT_OWN)
    if (timeLog.userId === user.id && permissions.includes(PERMISSIONS.TIMELOGS.EDIT_OWN)) {
        return true;
    }

    return false;
}

/**
 * Kiểm tra quyền GHI nhật ký thời gian
 */
export function canLogTime(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.TIMELOGS.LOG_TIME);
}

/**
 * Kiểm tra quyền XÓA nhật ký thời gian
 */
export function canDeleteTimeLog(user: User, timeLog: TimeLog, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Có quyền xóa tất cả (DELETE_ALL)
    if (permissions.includes(PERMISSIONS.TIMELOGS.DELETE_ALL)) return true;

    // RULE 2: Là người tạo và có quyền xóa nhật ký của mình (DELETE_OWN)
    if (timeLog.userId === user.id && permissions.includes(PERMISSIONS.TIMELOGS.DELETE_OWN)) {
        return true;
    }

    return false;
}
