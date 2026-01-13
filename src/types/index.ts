import {
    User,
    Role,
    Permission,
    Project,
    Task,
    Tracker,
    Status,
    Priority,
    Comment,
    Watcher,
    Attachment,
    Notification
} from '@prisma/client';

// ============================================
// USER TYPES
// ============================================

export type UserWithRoles = User & {
    projectMemberships: Array<{
        project: Project;
        role: Role;
    }>;
};

export type SafeUser = Omit<User, 'password'>;

// ============================================
// PROJECT TYPES
// ============================================

export type ProjectWithMembers = Project & {
    members: Array<{
        user: SafeUser;
        role: Role;
    }>;
    creator: SafeUser;
    _count: {
        tasks: number;
        members: number;
    };
};

export type ProjectMemberWithRole = {
    id: string;
    user: SafeUser;
    role: Role;
    createdAt: Date;
};

// ============================================
// TASK TYPES
// ============================================

export type TaskWithRelations = Task & {
    tracker: Tracker;
    status: Status;
    priority: Priority;
    project: Project;
    assignee: SafeUser | null;
    creator: SafeUser;
    parent: Task | null;
    subtasks: Task[];
    watchers: Array<{
        user: SafeUser;
    }>;
    comments: Array<Comment & {
        user: SafeUser;
    }>;
    attachments: Attachment[];
    _count: {
        subtasks: number;
        comments: number;
        watchers: number;
    };
};

export type TaskListItem = Task & {
    tracker: Tracker;
    status: Status;
    priority: Priority;
    project: Pick<Project, 'id' | 'name' | 'identifier'>;
    assignee: Pick<SafeUser, 'id' | 'name' | 'avatar'> | null;
    _count: {
        subtasks: number;
        comments: number;
    };
};

export type SubtaskItem = Pick<Task, 'id' | 'title' | 'statusId' | 'level' | 'path'> & {
    status: Pick<Status, 'id' | 'name' | 'isClosed'>;
    subtasks: SubtaskItem[];
};

// ============================================
// ROLE & PERMISSION TYPES
// ============================================

export type RoleWithPermissions = Role & {
    permissions: Array<{
        permission: Permission;
    }>;
    _count: {
        projectMembers: number;
    };
};

export type PermissionGroup = {
    module: string;
    permissions: Permission[];
};

// ============================================
// WORKFLOW TYPES
// ============================================

export type WorkflowMatrix = {
    trackerId: string;
    trackerName: string;
    roles: Array<{
        roleId: string | null;
        roleName: string;
        transitions: Array<{
            fromStatusId: string;
            fromStatusName: string;
            toStatusId: string;
            toStatusName: string;
            allowed: boolean;
        }>;
    }>;
};

export type AllowedTransition = {
    statusId: string;
    statusName: string;
    isClosed: boolean;
};

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationWithData = Notification & {
    metadata: {
        taskId?: string;
        taskTitle?: string;
        projectId?: string;
        projectName?: string;
        userId?: string;
        userName?: string;
    };
};

// ============================================
// DASHBOARD TYPES
// ============================================

export type DashboardStats = {
    projects: {
        total: number;
        active: number;
        archived: number;
    };
    tasks: {
        total: number;
        assigned: number;
        inProgress: number;
        completed: number;
        overdue: number;
    };
};

export type RecentActivity = {
    id: string;
    type: 'task_created' | 'task_updated' | 'comment_added' | 'status_changed';
    title: string;
    description: string;
    user: SafeUser;
    createdAt: Date;
    metadata: {
        taskId?: string;
        projectId?: string;
    };
};

// ============================================
// FORM TYPES
// ============================================

export type CreateProjectInput = {
    name: string;
    description?: string;
    identifier: string;
    startDate?: Date;
    endDate?: Date;
};

export type CreateTaskInput = {
    title: string;
    description?: string;
    trackerId: string;
    statusId: string;
    priorityId: string;
    projectId: string;
    assigneeId?: string;
    parentId?: string;
    estimatedHours?: number;
    dueDate?: Date;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
    id: string;
};

export type CreateCommentInput = {
    content: string;
    taskId: string;
};

// ============================================
// API RESPONSE TYPES
// ============================================

export type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};

// ============================================
// FILTER & SORT TYPES
// ============================================

export type TaskFilters = {
    projectId?: string;
    trackerId?: string;
    statusId?: string;
    priorityId?: string;
    assigneeId?: string;
    creatorId?: string;
    search?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    isOverdue?: boolean;
};

export type TaskSortBy =
    | 'createdAt'
    | 'updatedAt'
    | 'dueDate'
    | 'priority'
    | 'status'
    | 'title';

export type SortOrder = 'asc' | 'desc';
