/**
 * @file constants.ts
 * @description Khai báo các hằng số và quyền hạn (Permissions) dùng chung cho toàn dự án.
 * Quản lý tập trung các chuỗi định danh giúp tránh lỗi chính tả và dễ dàng bảo trì.
 */
export const PERMISSIONS = {
    // Tasks
    TASKS: {
        VIEW_ALL: 'tasks.view_all',
        VIEW_PROJECT: 'tasks.view_project',
        VIEW_ASSIGNED: 'tasks.view_assigned',
        CREATE: 'tasks.create',
        EDIT_ANY: 'tasks.edit_any',
        EDIT_ASSIGNED: 'tasks.edit_assigned',
        EDIT_OWN: 'tasks.edit_own',
        DELETE_ANY: 'tasks.delete_any',
        DELETE_OWN: 'tasks.delete_own',
        MANAGE_WATCHERS: 'tasks.manage_watchers',
        ASSIGN_OTHERS: 'tasks.assign_others',
    },
    // Comments
    COMMENTS: {
        ADD: 'comments.add',
        EDIT_OWN: 'comments.edit_own',
        EDIT_ALL: 'comments.edit_all',
        DELETE_OWN: 'comments.delete_own',
        DELETE_ALL: 'comments.delete_all',
    },
    // Time Tracking
    TIMELOGS: {
        LOG_TIME: 'timelogs.log_time',
        VIEW_ALL: 'timelogs.view_all',
        VIEW_OWN: 'timelogs.view_own',
        EDIT_ALL: 'timelogs.edit_all',
        EDIT_OWN: 'timelogs.edit_own',
        DELETE_ALL: 'timelogs.delete_all',
        DELETE_OWN: 'timelogs.delete_own',
    },
    // Projects
    PROJECTS: {
        CREATE: 'projects.create',
        EDIT: 'projects.edit',
        ARCHIVE: 'projects.archive',
        DELETE: 'projects.delete',
        MANAGE_MEMBERS: 'projects.manage_members',
        MANAGE_VERSIONS: 'projects.manage_versions',
        MANAGE_TRACKERS: 'projects.manage_trackers',
    },
    // Queries
    QUERIES: {
        MANAGE_PUBLIC: 'queries.manage_public',
    },
} as const;


export const ROLES = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    MEMBER: 'Member',
    DEVELOPER: 'Developer',
    QA: 'QA'
} as const;

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
} as const;

export const DEFAULT_STATUS_IDS = {
    NEW: 'new',
    CLOSED: 'closed',
} as const;
