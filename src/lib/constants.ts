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
        DELETE_ASSIGNED: 'tasks.delete_assigned',
        DELETE_OWN: 'tasks.delete_own',
        MANAGE_COMMENTS: 'tasks.manage_comments',
        LOG_TIME: 'tasks.log_time',
        VIEW_TIME_ENTRIES: 'tasks.view_time_entries',
        EDIT_TIME_ENTRIES: 'tasks.edit_time_entries',
        DELETE_TIME_ENTRIES: 'tasks.delete_time_entries',
    },
    // Projects
    PROJECTS: {
        CREATE: 'projects.create',
        VIEW_ALL: 'projects.view_all',
        EDIT: 'projects.edit',
        DELETE: 'projects.delete',
        MANAGE_MEMBERS: 'projects.manage_members',
        MANAGE_VERSIONS: 'projects.manage_versions',
        MANAGE_CATEGORIES: 'projects.manage_categories',
    },
    // Admin
    ADMIN: {
        MANAGE_USERS: 'admin.manage_users',
        MANAGE_ROLES: 'admin.manage_roles',
        MANAGE_SETTINGS: 'admin.manage_settings',
    },
    // Documents
    DOCUMENTS: {
        VIEW: 'documents.view',
        MANAGE: 'documents.manage',
    },
    // Wiki
    WIKI: {
        VIEW: 'wiki.view',
        MANAGE: 'wiki.manage', // Create, Edit, Delete, Watch, Lock, etc.
    }
} as const;

export const ROLES = {
    ADMIN: {
        CODE: 'ADMIN', // Often implicit, but good to have
    },
    MANAGER: {
        NAME_EN: 'Manager',
        NAME_VN: 'Quản lý'
    },
    MEMBER: {
        NAME_EN: 'Member',
        NAME_VN: 'Thành viên'
    }
} as const;

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
} as const;

export const DEFAULT_STATUS_IDS = {
    NEW: 'new', // Ideally these should be UUIDs or codes from DB seed
    CLOSED: 'closed',
} as const;
