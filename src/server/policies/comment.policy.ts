/**
 * @file comment.policy.ts
 * @description Attribute-based Access Control (ABAC) for Comments.
 */

import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

interface Comment {
    id: string;
    userId: string; // Creator of the comment
}

interface Task {
    projectId: string;
}

/**
 * Check if user can create a comment
 */
export function canCreateComment(user: User, permissions: string[]): boolean {
    if (user.isAdministrator) return true;
    return permissions.includes(PERMISSIONS.COMMENTS.ADD);
}


/**
 * Check if user can update a comment
 */
export function canUpdateComment(user: User, comment: Comment, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE: Creator can update their own comment
    if (comment.userId === user.id) return true;

    // RULE: User with EDIT_ALL permission
    if (permissions.includes(PERMISSIONS.COMMENTS.EDIT_ALL)) return true;

    return false;
}

/**
 * Check if user can delete a comment
 */
export function canDeleteComment(user: User, comment: Comment, permissions: string[]): boolean {
    if (user.isAdministrator) return true;

    // RULE: Creator can delete their own comment
    if (comment.userId === user.id) return true;

    // RULE: User with DELETE_ALL permission
    if (permissions.includes(PERMISSIONS.COMMENTS.DELETE_ALL)) return true;

    return false;
}
