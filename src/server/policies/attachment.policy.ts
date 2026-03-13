/**
 * @file attachment.policy.ts
 * @description Phân quyền dựa trên thuộc tính (ABAC) cho module Attachment.
 * Tập trung các quy tắc kiểm tra quan hệ giữa Người dùng và Tệp đính kèm.
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface Attachment {
    id: string;
    userId: string; // Uploader
}

/**
 * Kiểm tra quyền XÓA tệp đính kèm
 */
export function canDeleteAttachment(user: User, attachment: Attachment, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE 1: Có quyền xóa bất kỳ task nào (vì attachment thuộc task) -> Xóa được file
    // Theo logic trong route.ts: check PERMISSIONS.TASKS.DELETE_ANY
    if (permissions.includes(PERMISSIONS.TASKS.DELETE_ANY)) return true;

    // RULE 2: Là người tải lên
    if (attachment.userId === user.id) return true;

    return false;
}
