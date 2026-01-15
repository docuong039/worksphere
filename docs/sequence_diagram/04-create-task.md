# Sequence Diagram 04: Tạo công việc (UC-24)

> **Use Case**: UC-24 - Tạo công việc mới  
> **Module**: Task Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Permission Service, Task Service, Audit Service, Database |
| **Trigger** | User submit create task form |
| **Precondition** | User có quyền `tasks.create` trong project |
| **Postcondition** | Task được tạo, AuditLog được ghi, Parent được update (nếu có) |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Tạo công việc mới (UC-24)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks)" as API #Orange
participant "Permission\nService" as PermService #Pink
participant "Task\nService" as TaskService #LightGreen
participant "Audit\nService" as AuditService #Yellow
database "Database\n(Prisma)" as DB #LightGray

== Open Form ==
User -> Browser: Click "Tạo công việc"
Browser -> API: GET /api/projects/{id}/metadata
note right of API
    Load: trackers, statuses,
    priorities, members, versions
end note
API --> Browser: metadata
Browser -> Browser: Render CreateTaskForm

== Submit Form ==
User -> Browser: Nhập thông tin task
note right of Browser
    - subject (required)
    - description
    - trackerId, statusId, priorityId
    - assigneeId, versionId
    - startDate, dueDate
    - estimatedHours
    - parentId (optional - subtask)
end note
User -> Browser: Click "Tạo"

Browser -> API: POST /api/tasks\n{projectId, subject, ...}

== Authentication ==
API -> API: getServerSession()
alt Chưa đăng nhập
    API --> Browser: 401 Unauthorized
end

== Permission Check ==
API -> PermService: hasPermission(userId, projectId, "tasks.create")
PermService -> DB: SELECT role, permissions\nFROM ProjectMember pm\nJOIN Role r ON ...\nJOIN RolePermission rp ON ...
DB --> PermService: permissions[]

alt Không có quyền
    PermService --> API: false
    API --> Browser: 403 Forbidden
    Browser --> User: "Bạn không có quyền tạo công việc"
else Có quyền
    PermService --> API: true
end

== Validation ==
API -> TaskService: validateTask(data)
TaskService -> TaskService: Check required: subject
TaskService -> TaskService: Validate foreign keys

alt Validation failed
    TaskService --> API: ValidationError
    API --> Browser: 400 Bad Request
    Browser --> User: Hiển thị validation errors
end

== Validate Parent (if subtask) ==
opt parentId exists
    TaskService -> DB: SELECT * FROM Task\nWHERE id = ? AND projectId = ?
    DB --> TaskService: parentTask | null
    
    alt Parent không tồn tại hoặc khác project
        TaskService --> API: Error("Invalid parent task")
        API --> Browser: 400 Bad Request
        Browser --> User: "Công việc cha không hợp lệ"
    end
end

== Generate Task Number ==
TaskService -> DB: SELECT MAX(taskNumber) FROM Task\nWHERE projectId = ?
DB --> TaskService: maxNumber (e.g., 42)
TaskService -> TaskService: newTaskNumber = maxNumber + 1

== Create Task ==
TaskService -> DB: INSERT INTO Task\n(projectId, taskNumber, subject, ..., version=1)
DB --> TaskService: newTask

== Create Audit Log ==
TaskService -> AuditService: logCreate(userId, "Task", taskId, newTask)
AuditService -> DB: INSERT INTO AuditLog\n(userId, action="created", entityType, entityId, newValue)
DB --> AuditService: auditLog

== Update Parent (if subtask) ==
opt parentId exists
    TaskService -> TaskService: updateParentAttributes(parentId)
    
    TaskService -> DB: SELECT * FROM Task\nWHERE parentId = ?
    DB --> TaskService: allSubtasks[]
    
    TaskService -> TaskService: Calculate:\n- startDate = MIN(subtasks.startDate)\n- dueDate = MAX(subtasks.dueDate)\n- doneRatio = AVG(subtasks.doneRatio)
    
    TaskService -> DB: UPDATE Task SET\nstartDate, dueDate, doneRatio\nWHERE id = parentId
    DB --> TaskService: updated
end

== Response ==
TaskService --> API: task with relations
API --> Browser: 201 Created\n{task}
Browser -> Browser: Close form / Refresh list
Browser --> User: Redirect to /tasks/{taskNumber}

@enduml
```

---

## 3. Task Number Generation

```sql
-- Get max task number in project
SELECT COALESCE(MAX(taskNumber), 0) as maxNumber
FROM Task
WHERE projectId = 'project-uuid';

-- New task number = maxNumber + 1
-- E.g., if maxNumber = 42, new task = #43
```

---

## 4. Parent Update Logic

Khi tạo subtask, parent task được cập nhật:

| Field | Calculation | Config |
|-------|-------------|--------|
| startDate | MIN(subtasks.startDate) | If calculated mode |
| dueDate | MAX(subtasks.dueDate) | If calculated mode |
| doneRatio | AVG(subtasks.doneRatio) | If calculated mode |

---

## 5. Request/Response

### Request
```http
POST /api/tasks
Content-Type: application/json

{
  "projectId": "project-uuid",
  "subject": "Implement login feature",
  "description": "...",
  "trackerId": "tracker-uuid",
  "statusId": "status-uuid",
  "priorityId": "priority-uuid",
  "assigneeId": "user-uuid",
  "versionId": "version-uuid",
  "startDate": "2026-01-15",
  "dueDate": "2026-01-20",
  "estimatedHours": 8,
  "parentId": null
}
```

### Response (Success)
```http
HTTP/1.1 201 Created

{
  "id": "task-uuid",
  "taskNumber": 43,
  "subject": "Implement login feature",
  "project": {...},
  "tracker": {...},
  "status": {...},
  "createdAt": "2026-01-15T16:50:00Z"
}
```

---

*Ngày tạo: 2026-01-15*
