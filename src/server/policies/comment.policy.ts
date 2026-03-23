/**
 * @file comment.policy.ts
 * @description Phân quyền kiểm soát truy cập cho Bình luận (ABAC).
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface Comment {
    id: string;
    userId: string; // Người tạo bình luận
}

interface Task {
    projectId: string;
}

/**
 * Kiểm tra xem người dùng có thể tạo bình luận hay không
 */
export function canCreateComment(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.COMMENTS.ADD);
}


/**
 * Kiểm tra xem người dùng có thể cập nhật bình luận hay không
 */
export function canUpdateComment(user: User, comment: Comment, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // QUY TẮC: Người dùng có quyền EDIT_ALL
    if (permissions.includes(PERMISSIONS.COMMENTS.EDIT_ALL)) return true;

    // QUY TẮC: Người tạo có thể cập nhật bình luận của chính họ NẾU họ có quyền EDIT_OWN
    if (comment.userId === user.id && permissions.includes(PERMISSIONS.COMMENTS.EDIT_OWN)) return true;

    return false;
}

/**
 * Kiểm tra xem người dùng có thể xóa bình luận hay không
 */
export function canDeleteComment(user: User, comment: Comment, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // QUY TẮC: Người dùng có quyền DELETE_ALL
    if (permissions.includes(PERMISSIONS.COMMENTS.DELETE_ALL)) return true;

    // QUY TẮC: Người tạo có thể xóa bình luận của chính họ NẾU họ có quyền DELETE_OWN
    if (comment.userId === user.id && permissions.includes(PERMISSIONS.COMMENTS.DELETE_OWN)) return true;

    return false;
}
