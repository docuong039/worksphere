# Sequence Diagram 06: Thay đổi trạng thái (UC-26)

> **Use Case**: UC-26 - Thay đổi trạng thái  
> **Module**: Task Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Workflow Service, Task Service, Database |
| **Trigger** | User select new status from dropdown |
| **Precondition** | User có quyền edit, Transition được phép trong Workflow |
| **Postcondition** | Status updated, doneRatio updated, Parent recalculated |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Thay đổi trạng thái (UC-26)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks/[id])" as API #Orange
participant "Workflow\nService" as WorkflowService #Pink
participant "Task\nService" as TaskService #LightGreen
participant "Audit\nService" as AuditService #Yellow
database "Database\n(Prisma)" as DB #LightGray

== Load Available Statuses ==
User -> Browser: Click status dropdown
Browser -> API: GET /api/tasks/{id}/allowed-statuses
API -> TaskService: getTask(id)
TaskService -> DB: SELECT task with tracker
DB --> TaskService: task

API -> WorkflowService: getAllowedTransitions(trackerId, roleId, fromStatusId)
WorkflowService -> DB: SELECT toStatusId FROM WorkflowTransition\nWHERE trackerId = ?\nAND roleId = ?\nAND fromStatusId = ?
DB --> WorkflowService: allowedStatusIds[]

WorkflowService -> DB: SELECT * FROM Status\nWHERE id IN (allowedStatusIds)
DB --> WorkflowService: allowedStatuses[]

WorkflowService --> API: allowedStatuses
API --> Browser: allowedStatuses
Browser -> Browser: Populate dropdown with allowed statuses only

== Select New Status ==
User -> Browser: Select new status
Browser -> API: PATCH /api/tasks/{id}\n{statusId: newStatusId}

== Authentication & Permission ==
API -> API: getServerSession()
API -> API: Check edit permission (see SD-05)

== Get Current Task ==
API -> TaskService: getTask(id)
TaskService -> DB: SELECT * FROM Task
DB --> TaskService: currentTask

== Validate Workflow Transition ==
API -> WorkflowService: validateTransition(trackerId, roleId, fromStatusId, toStatusId)

WorkflowService -> DB: SELECT * FROM WorkflowTransition\nWHERE trackerId = ?\nAND roleId = ?\nAND fromStatusId = ?\nAND toStatusId = ?
DB --> WorkflowService: transition | null

alt Transition không tồn tại
    WorkflowService --> API: ForbiddenError
    API --> Browser: 403 Forbidden
    Browser --> User: "Không thể chuyển từ '{fromStatus}' sang '{toStatus}'"
end

WorkflowService --> API: valid

== Get New Status Info ==
API -> TaskService: getStatus(newStatusId)
TaskService -> DB: SELECT * FROM Status WHERE id = ?
DB --> TaskService: newStatus
note right of TaskService
    newStatus contains:
    - isClosed: boolean
    - defaultDoneRatio: number
end note

== Calculate Done Ratio ==
TaskService -> TaskService: Check if need to update doneRatio
alt newStatus has defaultDoneRatio
    TaskService -> TaskService: doneRatio = newStatus.defaultDoneRatio
end

== Update Task ==
TaskService -> DB: UPDATE Task SET\nstatusId = ?,\ndoneRatio = ?,\nupdatedAt = NOW(),\nversion = version + 1
DB --> TaskService: updatedTask

== Audit Log ==
TaskService -> AuditService: logChange("status", oldStatus.name, newStatus.name)
AuditService -> DB: INSERT INTO AuditLog
DB --> AuditService: auditLog

== Update Parent (if subtask) ==
opt task.parentId exists
    TaskService -> TaskService: updateParentAttributes(parentId)
    
    TaskService -> DB: SELECT doneRatio FROM Task\nWHERE parentId = ?
    DB --> TaskService: subtasks[]
    
    TaskService -> TaskService: parentDoneRatio = AVG(subtasks.doneRatio)
    
    TaskService -> DB: UPDATE Task SET doneRatio = ?\nWHERE id = parentId
    DB --> TaskService: updated
end

== Response ==
TaskService --> API: updatedTask
API --> Browser: 200 OK
Browser -> Browser: Update status badge color
Browser --> User: Status updated successfully

@enduml
```

---

## 3. Workflow Transition Matrix Example

```
Tracker: Bug    Role: Developer

Current Status → Allowed Next Statuses
─────────────────────────────────────────
New            → In Progress, Rejected
In Progress    → Resolved, On Hold
Resolved       → (none - handled by QA role)
On Hold        → In Progress
Rejected       → Reopened
Closed         → Reopened
```

---

## 4. Status with Default Done Ratio

| Status | isClosed | defaultDoneRatio |
|--------|----------|------------------|
| New | false | 0 |
| In Progress | false | 10 |
| Resolved | false | 80 |
| Closed | true | 100 |
| Rejected | true | 0 |

---

## 5. Request/Response

### Request
```http
PATCH /api/tasks/task-uuid
Content-Type: application/json

{
  "statusId": "resolved-status-uuid",
  "version": 5
}
```

### Response (Success)
```http
HTTP/1.1 200 OK

{
  "id": "task-uuid",
  "status": {
    "id": "resolved-status-uuid",
    "name": "Resolved",
    "isClosed": false
  },
  "doneRatio": 80,
  "version": 6
}
```

### Response (Forbidden)
```http
HTTP/1.1 403 Forbidden

{
  "error": "Workflow violation",
  "message": "Cannot transition from 'New' to 'Closed' with role 'Developer'"
}
```

---

*Ngày tạo: 2026-01-15*
