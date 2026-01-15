# Sequence Diagram 05: Cập nhật công việc (UC-25)

> **Use Case**: UC-25 - Cập nhật công việc  
> **Module**: Task Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Permission Service, Task Service, Audit Service, Notification Service, Database |
| **Trigger** | User save task changes |
| **Precondition** | User có quyền edit task |
| **Postcondition** | Task updated, Version incremented, Audit logged, Watchers notified |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Cập nhật công việc (UC-25)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks/[id])" as API #Orange
participant "Permission\nService" as PermService #Pink
participant "Task\nService" as TaskService #LightGreen
participant "Audit\nService" as AuditService #Yellow
participant "Notification\nService" as NotifyService #Cyan
database "Database\n(Prisma)" as DB #LightGray

== Load Task ==
User -> Browser: Open task detail
Browser -> API: GET /api/tasks/{id}
API -> DB: SELECT task with relations
DB --> API: task
API --> Browser: task (including version)
Browser -> Browser: Store currentVersion

== Edit Task ==
User -> Browser: Modify fields
User -> Browser: Click "Lưu"

Browser -> API: PATCH /api/tasks/{id}\n{changes, version: currentVersion}

== Authentication ==
API -> API: getServerSession()

== Get Current Task ==
API -> DB: SELECT * FROM Task WHERE id = ?
DB --> API: task

== Permission Check ==
API -> PermService: canEditTask(userId, task)

PermService -> DB: SELECT role, permissions FROM ProjectMember
DB --> PermService: userRole, permissions[]

alt Has tasks.edit_any
    PermService --> API: true
else Has tasks.edit_own AND is creator
    PermService -> PermService: Check task.creatorId === userId
    PermService --> API: true/false
else No permission
    PermService --> API: false
    API --> Browser: 403 Forbidden
    Browser --> User: "Bạn không có quyền sửa công việc này"
end

== Optimistic Locking ==
API -> TaskService: updateTask(id, changes, clientVersion)
TaskService -> DB: SELECT version FROM Task WHERE id = ?
DB --> TaskService: dbVersion

TaskService -> TaskService: Compare versions

alt clientVersion !== dbVersion
    TaskService --> API: ConflictError
    API --> Browser: 409 Conflict
    note right of Browser
        "Dữ liệu đã bị thay đổi bởi người khác"
        "Vui lòng refresh và thử lại"
    end note
    Browser --> User: Show conflict dialog
end

== Validation ==
TaskService -> TaskService: Validate changes
alt Validation failed
    TaskService --> API: ValidationError
    API --> Browser: 400 Bad Request
end

== Store Old Values ==
TaskService -> TaskService: oldValues = {...currentTask}

== Update Task ==
TaskService -> DB: UPDATE Task SET\n...changes,\nversion = version + 1,\nupdatedAt = NOW()\nWHERE id = ? AND version = clientVersion
DB --> TaskService: updatedTask

== Audit Log ==
TaskService -> AuditService: logChanges(userId, "Task", taskId, oldValues, newValues)

loop For each changed field
    AuditService -> DB: INSERT INTO AuditLog\n(userId, action="updated", entityType, entityId,\nfieldName, oldValue, newValue)
end
DB --> AuditService: auditLogs[]

== Update Parent (if subtask) ==
opt task.parentId exists
    TaskService -> TaskService: updateParentAttributes(parentId)
    TaskService -> DB: Calculate and UPDATE parent
    DB --> TaskService: updated
end

== Notify Watchers ==
TaskService -> NotifyService: notifyWatchers(taskId, changes)
NotifyService -> DB: SELECT userId FROM Watcher\nWHERE taskId = ?
DB --> NotifyService: watchers[]

loop For each watcher (except editor)
    NotifyService -> DB: INSERT INTO Notification\n(userId, type, taskId, message)
end

== Response ==
TaskService --> API: updatedTask (with new version)
API --> Browser: 200 OK\n{task}
Browser -> Browser: Update local state
Browser --> User: "Đã cập nhật công việc"

@enduml
```

---

## 3. Optimistic Locking Flow

```
Timeline:
─────────────────────────────────────────────────────────────►

User A                                      User B
   │                                           │
   ├─► Load task (version=5)                   │
   │                                           ├─► Load task (version=5)
   │                                           │
   ├─► Edit & Save (version=5)                 │
   │   └─► DB: version becomes 6              │
   │                                           │
   │                                           ├─► Edit & Save (version=5)
   │                                           │   └─► CONFLICT! DB version=6
   │                                           │       Client version=5
   │                                           │       Return 409
```

---

## 4. Audit Log Structure

```json
{
  "id": "audit-uuid",
  "userId": "user-uuid",
  "action": "updated",
  "entityType": "Task",
  "entityId": "task-uuid",
  "fieldName": "status",
  "oldValue": "New",
  "newValue": "In Progress",
  "createdAt": "2026-01-15T16:50:00Z"
}
```

---

## 5. Request/Response

### Request
```http
PATCH /api/tasks/task-uuid
Content-Type: application/json

{
  "subject": "Updated title",
  "statusId": "status-uuid",
  "assigneeId": "user-uuid",
  "version": 5
}
```

### Response (Success)
```http
HTTP/1.1 200 OK

{
  "id": "task-uuid",
  "subject": "Updated title",
  "version": 6,
  "updatedAt": "2026-01-15T17:00:00Z"
}
```

### Response (Conflict)
```http
HTTP/1.1 409 Conflict

{
  "error": "Conflict",
  "message": "Task has been modified by another user",
  "currentVersion": 6,
  "yourVersion": 5
}
```

---

*Ngày tạo: 2026-01-15*
