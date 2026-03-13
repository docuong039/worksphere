/**
 * @file query.policy.ts
 * @description Phân quyền dựa trên thuộc tính (ABAC) cho module Saved Query (Bộ lọc).
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface SavedQuery {
    id: string;
    userId: string; // Owner
    isPublic: boolean;
    projectId: string | null;
}

/**
 * Kiểm tra quyền XEM bộ lọc
 */
export function canViewQuery(user: User, query: SavedQuery): boolean {
    if (user.isAdministrator) return true;
    if (query.isPublic) return true;
    return query.userId === user.id;
}

/**
 * Kiểm tra quyền TẠO bộ lọc công khai
 */
export function canCreatePublicQuery(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.QUERIES.MANAGE_PUBLIC);
}

/**
 * Kiểm tra quyền CẬP NHẬT bộ lọc
 */
export function canUpdateQuery(user: User, query: SavedQuery, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // Chỉ chủ sở hữu mới được sửa
    if (query.userId !== user.id) return false;

    // Nếu muốn đổi từ Private sang Public, cần kiểm tra quyền MANAGE_PUBLIC (thực hiện ở controller nếu cần check sự thay đổi)
    return true;
}

/**
 * Kiểm tra quyền THIẾT LẬP CÔNG KHAI cho bộ lọc hiện có
 */
export function canMakePublic(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.QUERIES.MANAGE_PUBLIC);
}

/**
 * Kiểm tra quyền XÓA bộ lọc
 */
export function canDeleteQuery(user: User, query: SavedQuery): boolean {
    if (user.isAdministrator) return true;
    return query.userId === user.id;
}
