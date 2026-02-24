/**
 * @file audit-log.ts
 * @description Hệ thống ghi nhật ký hoạt động (Audit Trail).
 * Lưu lại lịch sử các thay đổi dữ liệu (giá trị cũ và mới) để phục vụ việc truy vết và giám sát.
 */
import prisma from '@/lib/prisma';

// Action types
export type AuditAction = 'created' | 'updated' | 'deleted' | 'archived' | 'unarchived';

// Entity types
export type AuditEntityType =
    | 'user'
    | 'project'
    | 'task'
    | 'comment'
    | 'attachment'
    | 'time_log'
    | 'role'
    | 'tracker'
    | 'status'
    | 'priority'
    | 'workflow';

interface AuditLogData {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    userId: string;
    changes?: {
        old?: Record<string, unknown>;
        new?: Record<string, unknown>;
    };
}

/**
 * Serialize changes object thành JSON string.
 * DB schema lưu `changes` là String? @db.LongText — không phải Json type.
 */
function serializeChanges(changes?: AuditLogData['changes']): string | null {
    if (!changes) return null;
    return JSON.stringify(changes);
}

/**
 * Parse changes string trở lại thành object khi đọc từ DB.
 * Export để các API route có thể dùng khi trả về response.
 */
export function parseAuditLogChanges(
    changes: string | null | undefined
): { old?: Record<string, unknown>; new?: Record<string, unknown> } | null {
    if (!changes) return null;
    try {
        return JSON.parse(changes);
    } catch {
        return null;
    }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
    return prisma.auditLog.create({
        data: {
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            userId: data.userId,
            // Serialize object → JSON string trước khi lưu vào LongText column
            changes: serializeChanges(data.changes),
        },
    });
}

/**
 * Log when an entity is created
 */
export async function logCreate(
    entityType: AuditEntityType,
    entityId: string,
    userId: string,
    newData?: Record<string, unknown>
) {
    return createAuditLog({
        action: 'created',
        entityType,
        entityId,
        userId,
        changes: newData ? { new: newData } : undefined,
    });
}

/**
 * Log when an entity is updated
 * Automatically calculates the diff between old and new data
 */
export async function logUpdate(
    entityType: AuditEntityType,
    entityId: string,
    userId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>
) {
    // Calculate diff - only include changed fields
    const changes: { old: Record<string, unknown>; new: Record<string, unknown> } = {
        old: {},
        new: {},
    };

    for (const key of Object.keys(newData)) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes.old[key] = oldData[key];
            changes.new[key] = newData[key];
        }
    }

    // Only create log if there are actual changes
    if (Object.keys(changes.new).length === 0) {
        return null;
    }

    return createAuditLog({
        action: 'updated',
        entityType,
        entityId,
        userId,
        changes,
    });
}

/**
 * Log when an entity is deleted
 */
export async function logDelete(
    entityType: AuditEntityType,
    entityId: string,
    userId: string,
    oldData?: Record<string, unknown>
) {
    return createAuditLog({
        action: 'deleted',
        entityType,
        entityId,
        userId,
        changes: oldData ? { old: oldData } : undefined,
    });
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(entityType: AuditEntityType, entityId: string) {
    return prisma.auditLog.findMany({
        where: {
            entityType,
            entityId,
        },
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get recent audit logs for a user (their actions)
 */
export async function getUserAuditLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}
