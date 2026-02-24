/**
 * @file user.policy.ts
 * @description Phân quyền dựa trên thuộc tính (ABAC) cho module User/Profile.
 */

interface User {
    id: string;
    isAdministrator: boolean;
}

/**
 * Kiểm tra quyền XEM profile
 * Admin hoặc chính chủ được xem đầy đủ thông tin.
 */
export function canViewProfile(user: User, targetUserId: string): boolean {
    if (user.isAdministrator) return true;
    return user.id === targetUserId;
}

/**
 * Kiểm tra quyền CẬP NHẬT profile
 * Admin hoặc chính chủ được cập nhật.
 */
export function canUpdateProfile(user: User, targetUserId: string): boolean {
    if (user.isAdministrator) return true;
    return user.id === targetUserId;
}

/**
 * Kiểm tra quyền XÓA người dùng
 * Chỉ Admin được xóa và không được tự xóa chính mình.
 */
export function canDeleteUser(user: User, targetUserId: string): boolean {
    if (!user.isAdministrator) return false;
    return user.id !== targetUserId;
}

/**
 * Kiểm tra quyền thay đổi trạng thái/quyền quản trị (Admin Fields)
 * Chỉ Admin mới được sửa các trường nhạy cảm.
 */
export function canManageAdminFields(user: User): boolean {
    return user.isAdministrator;
}
