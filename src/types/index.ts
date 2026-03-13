/**
 * @file src/types/index.ts
 * @description
 * TỪ ĐIỂN KIỂU DỮ LIỆU CỦA DỰ ÁN.
 * Định nghĩa cấu trúc (khuôn mẫu) cho Task, User, Project... để Backend và Frontend dùng chung,
 * giúp code đồng bộ, hỗ trợ tự động nhắc lệnh (autocompletion) và ngăn lỗi gõ sai thuộc tính.
 */
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
    Attachment,
    Notification,
    Query,
    Version,
    TimeLog,
    TimeEntryActivity
} from '@prisma/client';

export type SavedQuery = Query;

export type SavedQueryWithRelations = SavedQuery & {
    user: SafeUser;
    project: Project | null; // Using full project which is fine since SafeUser/Project are exported
};

export type {
    User,
    Role,
    Permission,
    Project,
    Task,
    Tracker,
    Status,
    Priority,
    Comment,
    Attachment,
    Notification,
    Query,
    Version,
    TimeLog,
    TimeEntryActivity
};

import { z } from 'zod';
import {
    createProjectSchema,
    updateProjectSchema,
    createTaskSchema,
    updateTaskSchema,
    createCommentSchema,
    createTrackerSchema,
    updateTrackerSchema,
    createTimeLogSchema,
    updateTimeLogSchema,
    createStatusSchema,
    updateStatusSchema,
    createPrioritySchema,
    updatePrioritySchema,
    createRoleSchema,
    updateRoleSchema,
    createUserSchema,
    updateUserSchema,
    createVersionSchema,
    updateVersionSchema,
    createActivitySchema,
    updateActivitySchema,
    updateWorkflowSchema
} from '@/lib/validations';

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
    tasks: Array<{ id: string }>;
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

export type SubtaskWithRelations = Task & {
    status: Status;
    assignee: SafeUser | null;
    priority: Priority;
    tracker: Tracker;
    timeLogs?: Array<{ hours: number }>; // Bottom-Up: cộng giờ thực tế lên task cha
};

export type AttachmentWithUser = Attachment & {
    user: SafeUser;
};

export type TaskWithRelations = Task & {
    tracker: Tracker;
    status: Status;
    priority: Priority;
    project: Project & {
        members?: Array<{
            user: SafeUser;
        }>;
    };
    assignee: SafeUser | null;
    creator: SafeUser;
    parent: Task | null;
    subtasks: SubtaskWithRelations[];
    version: Version | null;
    watchers?: Array<{
        userId: string; // Including userId for convenience
        user: SafeUser;
    }>;
    comments?: Array<Comment & {
        user: SafeUser;
    }>;
    attachments?: AttachmentWithUser[];
    _count: {
        subtasks: number;
        comments: number;
        watchers?: number;
    };
    timeLogs?: Array<{
        id: string;
        hours: number;
        spentOn: Date;
        comments: string | null;
        activity: { id: string; name: string };
        user: { id: string; name: string };
    }>;
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
    trackers: Array<{ trackerId: string; roleId: string }>;
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

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema> & { id?: string };

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// Tracker Types
export type CreateTrackerInput = z.infer<typeof createTrackerSchema>;
export type UpdateTrackerInput = z.infer<typeof updateTrackerSchema>;

// Status Types
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// Priority Types
export type CreatePriorityInput = z.infer<typeof createPrioritySchema>;
export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>;

// Role Types
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// User Types Inputs
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Version Types
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;

// Activity Types (Time Entry Activity)
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
// Alias for clarity in services
export type CreateTimeEntryActivityInput = CreateActivityInput;
export type UpdateTimeEntryActivityInput = UpdateActivityInput;


// Workflow Types
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

// Time Log Types
export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;

// Service Specific Inputs
export interface AddProjectMemberInput {
    userIds: string[];
    roleId: string;
}

export interface UpdateProjectMemberRoleInput {
    roleId: string;
}

export interface UpdateProjectTrackersInput {
    trackerIds: string[];
}

export interface UpdateRolePermissionsInput {
    permissionIds: string[];
}

export interface UpdateRoleTrackersInput {
    trackerIds: string[];
}

export type VersionWithStats = Version & {
    totalTasks: number;
    closedTasks: number;
    progress: number;
};

// ============================================
// SERVICE TYPES (Legacy Consilidation)
// ============================================

// Workflow
export type WorkflowTransition = {
    fromStatusId: string;
    toStatusId: string;
    allowed: boolean;
};

// Activity (Audit Log)
export interface ActivityChanges {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
}

export interface ActivityItem {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    changes: ActivityChanges | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
    entityDetails?: {
        id: string;
        name?: string; // For Project
        title?: string; // For Task
        number?: number;
        project?: { id: string; name: string };
    };
}

export interface ActivityListResponse {
    success: boolean;
    data: {
        activities: ActivityItem[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    };
}

// Reports
export interface ReportSummary {
    totalProjects: number;
    totalTasks: number;
    openTasks: number;
    closedTasks: number;
    completionRate: number;
}

export interface ReportProject {
    id: string;
    name: string;
    totalTasks: number;
    totalMembers: number;
    openTasks: number;
    closedTasks: number;
    completionRate: number;
}

export interface ReportUser {
    id: string;
    name: string;
    email: string;
    totalAssigned: number;
    openTasks: number;
    closedTasks: number;
    completionRate?: number; // Optional as not always present
}

export interface ReportTime {
    userId: string;
    userName: string;
    totalHours: number;
    projects: Record<string, number>;
}

export type ReportType = 'summary' | 'by-project' | 'by-user' | 'by-time';

// ============================================
// API RESPONSE TYPES
// ============================================

export type ApiResponse<T = unknown> = {
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
    dueDateFrom?: string | Date;
    dueDateTo?: string | Date;
    startDateFrom?: string | Date;
    startDateTo?: string | Date;
    isOverdue?: boolean;
    showClosed?: boolean;
    myTasks?: boolean;
    parentId?: string | null;
    isClosed?: string; // helper for query params
    my?: string; // helper for query params
    page?: number;
    pageSize?: number;
};

export type TaskSortBy =
    | 'createdAt'
    | 'updatedAt'
    | 'dueDate'
    | 'priority'
    | 'status'
    | 'title';

export type SortOrder = 'asc' | 'desc';

export type SessionUser = { id: string; isAdministrator: boolean; name?: string | null; };
