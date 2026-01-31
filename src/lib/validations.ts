import { z } from 'zod';

// ============================================
// TRACKER
// ============================================

export const createTrackerSchema = z.object({
    name: z.string().min(1, 'Tên tracker không được để trống').max(50),
    description: z.string().optional(),
    position: z.number().int().optional(),
    isDefault: z.boolean().optional(),
});

export const updateTrackerSchema = createTrackerSchema.partial();

// ============================================
// STATUS
// ============================================

export const createStatusSchema = z.object({
    name: z.string().min(1, 'Tên status không được để trống').max(50),
    description: z.string().optional(),
    position: z.number().int().optional(),
    isClosed: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    defaultDoneRatio: z.number().int().min(0).max(100).optional().nullable(),
});

export const updateStatusSchema = createStatusSchema.partial();

// ============================================
// PRIORITY
// ============================================

export const createPrioritySchema = z.object({
    name: z.string().min(1, 'Tên priority không được để trống').max(50),
    position: z.number().int().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Màu không hợp lệ').optional(),
    isDefault: z.boolean().optional(),
});

export const updatePrioritySchema = createPrioritySchema.partial();

// ============================================
// ROLE
// ============================================

export const createRoleSchema = z.object({
    name: z.string().min(1, 'Tên vai trò không được để trống').max(50),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    assignable: z.boolean().optional(),
    canAssignToOther: z.boolean().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

// ============================================
// USER
// ============================================

export const createUserSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    name: z.string().min(1, 'Tên không được để trống').max(100),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    isAdministrator: z.boolean().optional(),
});

export const updateUserSchema = z.object({
    email: z.string().email('Email không hợp lệ').optional(),
    name: z.string().min(1).max(100).optional(),
    password: z.string().min(6).optional(),
    isAdministrator: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

// ============================================
// PROJECT
// ============================================

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Tên dự án không được để trống').max(100),
    description: z.string().optional(),
    identifier: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Identifier chỉ chứa chữ thường, số và dấu gạch ngang'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================
// VERSION / MILESTONE
// ============================================

export const createVersionSchema = z.object({
    name: z.string().min(1, 'Tên version không được để trống').max(100),
    description: z.string().optional(),
    status: z.enum(['open', 'locked', 'closed']).optional(),
    dueDate: z.string().optional(),
    projectId: z.string().min(1, 'Project không được để trống'),
});

export const updateVersionSchema = createVersionSchema.partial().omit({ projectId: true });

// ============================================
// TASK
// ============================================

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
    description: z.string().optional(),
    trackerId: z.string().min(1, 'Tracker không được để trống'),
    statusId: z.string().min(1, 'Status không được để trống'),
    priorityId: z.string().min(1, 'Priority không được để trống'),
    projectId: z.string().min(1, 'Project không được để trống'),
    assigneeId: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    versionId: z.string().optional().nullable(),

    estimatedHours: z.number().positive().optional().nullable(),
    doneRatio: z.number().int().min(0).max(100).optional(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    isPrivate: z.boolean().optional(),
    customFields: z.record(z.string(), z.any()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
    lockVersion: z.number().int().optional(),
    parentId: z.string().optional().nullable(), // Allow changing parent (moving task)
});

// ============================================
// COMMENT
// ============================================

export const createCommentSchema = z.object({
    content: z.string().min(1, 'Nội dung không được để trống'),
    taskId: z.string().min(1, 'Task không được để trống'),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, 'Nội dung không được để trống'),
});

// ============================================
// WORKFLOW
// ============================================

export const updateWorkflowSchema = z.object({
    trackerId: z.string().min(1),
    roleId: z.string().nullable(),
    transitions: z.array(z.object({
        fromStatusId: z.string(),
        toStatusId: z.string(),
        allowed: z.boolean(),
    })),
});

// ============================================
// WATCHER
// ============================================

export const addWatcherSchema = z.object({
    userId: z.string().min(1, 'User không được để trống'),
});

export const removeWatcherSchema = z.object({
    userId: z.string().min(1, 'User không được để trống'),
});

// ============================================
// TIME LOG & ACTIVITY
// ============================================

export const createTimeLogSchema = z.object({
    hours: z.number().positive('Số giờ phải lớn hơn 0'),
    spentOn: z.string().min(1, 'Ngày thực hiện không được để trống'),
    activityId: z.string().min(1, 'Hoạt động không được để trống'),
    comments: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    projectId: z.string().optional(),
});

export const updateTimeLogSchema = createTimeLogSchema.partial();

export const createActivitySchema = z.object({
    name: z.string().min(1, 'Tên hoạt động không được để trống').max(100),
    position: z.number().int().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();
