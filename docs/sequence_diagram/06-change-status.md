# Sequence Diagram 06: Thay đổi trạng thái (UC-26)

> **Use Case**: UC-26 - Thay đổi trạng thái  
> **Module**: Task Management  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Workflow Service, Task Service, Database |
| **API Endpoint** | PUT /api/tasks/[id] (with statusId change) |
| **Source Files** | `src/app/api/tasks/[id]/route.ts`, `src/lib/permissions.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Thay đổi trạng thái (UC-26)
footer Based on: src/app/api/tasks/[id]/route.ts + src/lib/permissions.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "PUT /api/tasks/[id]" as API #Orange
participant "canTransitionStatus()" as Workflow #Pink
participant "updateParentAttributes()" as ParentUpdate #LightGreen
participant "notifyTaskStatusChanged()" as Notify #Cyan
database "Prisma\n(Database)" as DB #LightGray

== Load Allowed Statuses ==
User -> Browser: Click status dropdown
note right of Browser
  Browser may call API to get
  allowed transitions for UI
end note

== Select & Submit ==
User -> Browser: Select new status
Browser -> API: PUT /api/tasks/{id}\n{statusId: newStatusId, lockVersion: current}

== Authentication & Edit Permission ==
API -> API: auth() + canEditTask()
note right of API: See SD-05 for full flow

== Get Current Task ==
API -> DB: SELECT statusId, trackerId, projectId, parentId, lockVersion\nFROM Task WHERE id = ?
DB --> API: currentTask

== Workflow Validation ==
API -> API: Check if statusId changed
opt currentTask.statusId !== body.statusId
    API -> Workflow: canTransitionStatus(user, taskId, newStatusId)
    
    Workflow -> DB: SELECT statusId, trackerId, projectId FROM Task
    DB --> Workflow: task
    
    Workflow -> DB: SELECT roleId FROM ProjectMember\nWHERE userId = ? AND projectId = ?
    DB --> Workflow: roleIds[]
    
    Workflow -> DB: SELECT * FROM WorkflowTransition\nWHERE trackerId = ?\nAND fromStatusId = ?\nAND toStatusId = ?\nAND (roleId IS NULL OR roleId IN roleIds)
    note right of DB
      roleId = NULL means
      transition applies to ALL roles
    end note
    DB --> Workflow: transition | null
    
    alt Transition NOT found
        Workflow --> API: false
        API --> Browser: 403 "Không được phép chuyển sang\ntrạng thái này theo quy trình làm việc (Workflow)"
    else Transition found
        Workflow --> API: true
    end
end

== Optimistic Locking ==
API -> API: Check lockVersion match
alt Mismatch
    API --> Browser: 409 Conflict
end

== Get New Status Info ==
API -> DB: SELECT isClosed, defaultDoneRatio FROM Status\nWHERE id = newStatusId
DB --> API: newStatus

API -> DB: SELECT isClosed FROM Status\nWHERE id = currentTask.statusId
DB --> API: oldStatus

== Calculate Done Ratio ==
API -> API: Determine doneRatio
alt newStatus.isClosed = true
    API -> API: doneRatio = 100
    note right: FORCE 100% for closed status\n(Redmine standard behavior)
else oldStatus.isClosed AND !newStatus.isClosed
    API -> API: doneRatio = newStatus.defaultDoneRatio ?? 0
    note right: Reset when reopening
else Manual doneRatio not provided AND defaultDoneRatio exists
    API -> API: doneRatio = newStatus.defaultDoneRatio
end

== Update Task ==
API -> DB: UPDATE Task SET\n  statusId = newStatusId,\n  doneRatio = calculated,\n  lockVersion = lockVersion + 1
DB --> API: updatedTask

== Update Parent (if subtask) ==
opt task.parentId exists
    API -> ParentUpdate: updateParentAttributes(parentId)
    
    ParentUpdate -> DB: SELECT doneRatio, estimatedHours FROM subtasks
    ParentUpdate -> ParentUpdate: Calculate weighted average doneRatio
    ParentUpdate -> DB: UPDATE parent SET doneRatio = avg
    
    opt Recursive (grandparent exists)
        ParentUpdate -> ParentUpdate: updateParentAttributes(grandparentId)
    end
end

== Notifications ==
API -> Notify: notifyTaskStatusChanged(\n  taskId, title, userId, actorName,\n  oldStatusName, newStatusName)
Notify -> DB: Get watchers
Notify -> DB: INSERT Notifications for each watcher

== Audit Log ==
API -> API: logUpdate(..., {statusId: old}, {statusId: new})

== Response ==
API --> Browser: 200 OK {task}
Browser -> Browser: Update UI (status badge, color)
Browser --> User: Status updated

@enduml
```

---

## 3. Workflow Transition Logic (từ code)

```typescript
// src/lib/permissions.ts - canTransitionStatus()
export async function canTransitionStatus(
    user: PermissionUser,
    taskId: string,
    toStatusId: string
): Promise<boolean> {
    if (user.isAdministrator) return true;  // Admin bypasses workflow

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { statusId: true, trackerId: true, projectId: true },
    });

    const memberships = await prisma.projectMember.findMany({
        where: { userId: user.id, projectId: task.projectId },
        select: { roleId: true },
    });

    const roleIds = memberships.map((m) => m.roleId);

    // Check if transition is allowed
    const allowedTransition = await prisma.workflowTransition.findFirst({
        where: {
            trackerId: task.trackerId,
            fromStatusId: task.statusId,
            toStatusId: toStatusId,
            OR: [
                { roleId: null },           // NULL = applies to all roles
                { roleId: { in: roleIds } }, // OR role matches user's role
            ],
        },
    });

    return !!allowedTransition;
}
```

---

## 4. Auto Done Ratio Logic (từ code)

```typescript
// src/app/api/tasks/[id]/route.ts - Lines 410-421
if (newStatus.isClosed) {
    // FORCE doneRatio=100 for closed statuses (Redmine standard)
    updateData.doneRatio = 100;
} else if (oldStatus?.isClosed && !newStatus.isClosed) {
    // Chuyển từ CLOSED sang OPEN -> reset doneRatio
    updateData.doneRatio = newStatus.defaultDoneRatio ?? 0;
} else if (validatedData.doneRatio === undefined && 
           newStatus.defaultDoneRatio !== null) {
    // If done ratio not manually set, use status default
    updateData.doneRatio = newStatus.defaultDoneRatio;
}
```

---

## 5. WorkflowTransition Table

```sql
CREATE TABLE WorkflowTransition (
    id          TEXT PRIMARY KEY,
    trackerId   TEXT NOT NULL,
    roleId      TEXT NULL,         -- NULL = all roles
    fromStatusId TEXT NOT NULL,
    toStatusId   TEXT NOT NULL
);
```

| trackerId | roleId | fromStatusId | toStatusId |
|-----------|--------|--------------|------------|
| Bug | Developer | New | In Progress |
| Bug | Developer | In Progress | Resolved |
| Bug | NULL | Resolved | Closed |
| Bug | Tester | Closed | Reopened |

---

## 6. Request/Response

### Request
```http
PUT /api/tasks/task-uuid
Content-Type: application/json

{
  "statusId": "resolved-status-uuid",
  "lockVersion": 5
}
```

### Success Response (200)
```json
{
  "id": "task-uuid",
  "status": {
    "id": "resolved-status-uuid",
    "name": "Resolved",
    "isClosed": false
  },
  "doneRatio": 80,
  "lockVersion": 6
}
```

### Error Response (403 - Workflow)
```json
{
  "error": "Không được phép chuyển sang trạng thái này theo quy trình làm việc (Workflow)"
}
```

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
