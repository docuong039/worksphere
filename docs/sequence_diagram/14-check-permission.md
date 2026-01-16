# Sequence Diagram 14: Check Permission (Common Pattern)

> **Use Case**: Common - Được gọi từ nhiều UC  
> **Module**: RBAC System  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Caller (API Route), Permission Service, Prisma |
| **Source File** | `src/lib/permissions.ts` |
| **Export Functions** | hasPermission, canEditTask, canTransitionStatus, getAccessibleProjectIds, etc. |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Check Permission (Common Pattern)
footer Based on: src/lib/permissions.ts

participant "Caller\n(API Route)" as Caller #LightBlue
participant "hasPermission()" as HasPerm #Pink
participant "canEditTask()" as CanEdit #Pink
participant "canTransitionStatus()" as CanTransition #Pink
database "Prisma\n(Database)" as DB #LightGray

== hasPermission(user, permissionKey, projectId?) ==

Caller -> HasPerm: hasPermission(user, "tasks.create", projectId)

HasPerm -> HasPerm: Check user.isAdministrator
alt isAdministrator
    HasPerm --> Caller: true
    note right: Admin bypasses all checks
end

HasPerm -> DB: SELECT * FROM ProjectMember\nWHERE userId = user.id\n  AND (projectId = ? OR all if null)\nINCLUDE role.permissions.permission
DB --> HasPerm: memberships[]

loop For each membership
    HasPerm -> HasPerm: Check role.permissions.some(\n  rp => rp.permission.key === permissionKey\n)
    alt Found permission
        HasPerm --> Caller: true
    end
end

HasPerm --> Caller: false

||40||

== canEditTask(user, taskId) ==

Caller -> CanEdit: canEditTask(user, taskId)

CanEdit -> CanEdit: Check isAdministrator
alt isAdministrator
    CanEdit --> Caller: true
end

CanEdit -> DB: SELECT creatorId, assigneeId, projectId\nFROM Task WHERE id = ?
DB --> CanEdit: task

CanEdit -> DB: SELECT role.permissions FROM ProjectMember\nWHERE userId = ? AND projectId = ?
DB --> CanEdit: membership with permissions

CanEdit -> CanEdit: permissions = role.permissions.map(p => p.permission.key)

alt permissions.includes('tasks.edit_any')
    CanEdit --> Caller: true
else task.creatorId === userId AND 'tasks.edit_own'
    CanEdit --> Caller: true
else task.assigneeId === userId AND 'tasks.edit_assigned'
    CanEdit --> Caller: true
else
    CanEdit --> Caller: false
end

||40||

== canTransitionStatus(user, taskId, toStatusId) ==

Caller -> CanTransition: canTransitionStatus(user, taskId, newStatusId)

CanTransition -> CanTransition: Check isAdministrator
alt isAdministrator
    CanTransition --> Caller: true
    note right: Admin bypass workflow
end

CanTransition -> DB: SELECT statusId, trackerId, projectId\nFROM Task WHERE id = ?
DB --> CanTransition: task

CanTransition -> DB: SELECT roleId FROM ProjectMember\nWHERE userId = ? AND projectId = ?
DB --> CanTransition: roleIds[]

CanTransition -> DB: SELECT * FROM WorkflowTransition\nWHERE trackerId = task.trackerId\n  AND fromStatusId = task.statusId\n  AND toStatusId = newStatusId\n  AND (roleId IS NULL OR roleId IN roleIds)
note right of DB
  roleId = NULL means
  "allowed for ALL roles"
end note
DB --> CanTransition: transition | null

alt transition exists
    CanTransition --> Caller: true
else
    CanTransition --> Caller: false
end

@enduml
```

---

## 3. Permission Functions Overview

| Function | Purpose | Used By |
|----------|---------|---------|
| `hasPermission()` | Check specific permission in project | Create task, manage members |
| `hasAnyPermission()` | Check ANY of permissions | Multiple permission check |
| `hasAllPermissions()` | Check ALL permissions | Strict permission check |
| `getUserPermissions()` | Get all user's permissions | UI display |
| `isProjectMember()` | Check membership | Basic access check |
| `canViewTask()` | Can view task (incl. private) | Task detail |
| `canEditTask()` | Can edit task | Task update |
| `canTransitionStatus()` | Workflow validation | Status change |
| `getAccessibleProjectIds()` | Get projects with permission | Task list filter |
| `checkProjectPermission()` | Wrapper for cleaner code | API routes |

---

## 4. hasPermission Logic (từ code)

```typescript
// Line 27-67
export async function hasPermission(
    user: PermissionUser,
    permissionKey: string,
    projectId?: string
): Promise<boolean> {
    // 1. Administrator bypass
    if (user.isAdministrator) {
        return true;
    }

    // 2. Get user's memberships (in specific project or all)
    const memberships = await prisma.projectMember.findMany({
        where: {
            userId: user.id,
            ...(projectId ? { projectId } : {}),
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    // 3. Check if any role has the permission
    for (const membership of memberships) {
        const hasPermission = membership.role.permissions.some(
            (rp) => rp.permission.key === permissionKey
        );
        if (hasPermission) return true;
    }

    return false;
}
```

---

## 5. canEditTask Logic (từ code)

```typescript
// Line 237-274
export async function canEditTask(
    user: PermissionUser,
    taskId: string
): Promise<boolean> {
    if (user.isAdministrator) return true;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true, assigneeId: true, creatorId: true },
    });

    if (!task) return false;

    // Check permissions in priority order
    if (await hasPermission(user, 'tasks.edit_any', task.projectId)) {
        return true;
    }
    if (task.assigneeId === user.id) {
        if (await hasPermission(user, 'tasks.edit_assigned', task.projectId)) {
            return true;
        }
    }
    if (task.creatorId === user.id) {
        if (await hasPermission(user, 'tasks.edit_own', task.projectId)) {
            return true;
        }
    }

    return false;
}
```

---

## 6. Workflow Transition Logic (từ code)

```typescript
// Line 279-322
export async function canTransitionStatus(
    user: PermissionUser,
    taskId: string,
    toStatusId: string
): Promise<boolean> {
    if (user.isAdministrator) return true;

    const task = await prisma.task.findUnique({...});
    if (!task) return false;

    // Get user's roles in the project
    const memberships = await prisma.projectMember.findMany({
        where: { userId: user.id, projectId: task.projectId },
        select: { roleId: true },
    });
    const roleIds = memberships.map((m) => m.roleId);

    // Check if transition is allowed for any of user's roles
    const allowedTransition = await prisma.workflowTransition.findFirst({
        where: {
            trackerId: task.trackerId,
            fromStatusId: task.statusId,
            toStatusId: toStatusId,
            OR: [
                { roleId: null },           // NULL = all roles
                { roleId: { in: roleIds } }, // OR specific role
            ],
        },
    });

    return !!allowedTransition;
}
```

---

## 7. Permission Key Reference

| Key | Description |
|-----|-------------|
| `projects.create` | Tạo dự án mới |
| `projects.manage_members` | Quản lý thành viên |
| `projects.manage_versions` | Quản lý phiên bản |
| `projects.manage_trackers` | Quản lý tracker |
| `tasks.create` | Tạo công việc (Add Issues) |
| `tasks.edit_own` | Sửa công việc do mình tạo |
| `tasks.edit_any` | Sửa mọi công việc |
| `tasks.edit_assigned` | Sửa công việc được gán |
| `tasks.delete` | Xóa công việc |
| `tasks.move` | Di chuyển công việc |
| `tasks.view_project` | Xem công việc trong dự án |
| `queries.manage_public` | Tạo bộ lọc công khai |

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
