# Sequence Diagram 11: Xem chi tiết công việc (UC-23)

> **Use Case**: UC-23 - Xem chi tiết công việc  
> **Module**: Task Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Task Service, Permission Service, Database |
| **Trigger** | User click on task |
| **Precondition** | User có quyền view task |
| **Postcondition** | Full task detail with all relations displayed |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xem chi tiết công việc (UC-23)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks/[id])" as API #Orange
participant "Task\nService" as TaskService #LightGreen
participant "Permission\nService" as PermService #Pink
database "Database\n(Prisma)" as DB #LightGray

== Navigate to Task ==
User -> Browser: Click on task #42
Browser -> API: GET /api/tasks/{id}

== Authentication ==
API -> API: getServerSession()

== Get Task ==
API -> TaskService: getTaskDetail(id)
TaskService -> DB: SELECT * FROM Task WHERE id = ?
DB --> TaskService: task | null

alt Task không tồn tại
    TaskService --> API: null
    API --> Browser: 404 Not Found
    Browser --> User: "Công việc không tồn tại"
end

== Permission Check ==
API -> PermService: canViewTask(userId, task)

PermService -> DB: SELECT projectId FROM ProjectMember\nWHERE userId = ? AND projectId = task.projectId
DB --> PermService: member | null

alt Không phải member
    alt isAdministrator
        PermService --> API: true
    else
        PermService --> API: false
        API --> Browser: 403 Forbidden
    end
end

== Check Private Task ==
alt task.isPrivate = true
    PermService -> PermService: Check userId = creatorId OR assigneeId
    alt Không phải creator/assignee
        PermService --> API: false
        API --> Browser: 403 Forbidden
    end
end

PermService --> API: true

== Load Related Data ==
par Parallel Load
    TaskService -> DB: SELECT * FROM Task t\nJOIN Tracker ON ...\nJOIN Status ON ...\nJOIN Priority ON ...\nLEFT JOIN User assignee ON ...\nLEFT JOIN User creator ON ...\nLEFT JOIN Version ON ...\nWHERE t.id = ?
    DB --> TaskService: taskWithRelations
and Load Subtasks
    TaskService -> DB: SELECT * FROM Task\nWHERE parentId = ?\nORDER BY taskNumber
    DB --> TaskService: subtasks[]
and Load Comments
    TaskService -> DB: SELECT c.*, u.name, u.avatar\nFROM Comment c\nJOIN User u ON c.userId = u.id\nWHERE c.taskId = ?\nORDER BY c.createdAt ASC
    DB --> TaskService: comments[]
and Load Attachments
    TaskService -> DB: SELECT a.*, u.name\nFROM Attachment a\nJOIN User u ON a.userId = u.id\nWHERE a.taskId = ?
    DB --> TaskService: attachments[]
and Load Watchers
    TaskService -> DB: SELECT w.*, u.name, u.avatar\nFROM Watcher w\nJOIN User u ON w.userId = u.id\nWHERE w.taskId = ?
    DB --> TaskService: watchers[]
and Load History
    TaskService -> DB: SELECT al.*, u.name\nFROM AuditLog al\nJOIN User u ON al.userId = u.id\nWHERE al.entityType = 'Task'\nAND al.entityId = ?\nORDER BY al.createdAt DESC
    DB --> TaskService: history[]
and Load Parent
    opt task.parentId exists
        TaskService -> DB: SELECT id, taskNumber, subject\nFROM Task WHERE id = parentId
        DB --> TaskService: parentTask
    end
end

== Assemble Response ==
TaskService -> TaskService: Combine all data
TaskService --> API: fullTaskDetail

API --> Browser: 200 OK\n{task}

Browser -> Browser: Render TaskDetailPage
Browser --> User: Display task detail

@enduml
```

---

## 3. Related Data Structure

| Relation | Data Loaded |
|----------|-------------|
| Tracker | id, name, color |
| Status | id, name, isClosed, color |
| Priority | id, name, color |
| Assignee | id, name, email, avatar |
| Creator | id, name, email, avatar |
| Version | id, name, status |
| Project | id, name, identifier |
| Parent | id, taskNumber, subject |
| Subtasks[] | id, taskNumber, subject, status, assignee |
| Comments[] | id, content, author, createdAt |
| Attachments[] | id, filename, size, uploader, createdAt |
| Watchers[] | id, user (name, avatar) |
| History[] | id, action, fieldName, oldValue, newValue, user, createdAt |

---

## 4. Request/Response

### Request
```http
GET /api/tasks/task-uuid
```

### Response
```http
HTTP/1.1 200 OK

{
  "id": "task-uuid",
  "taskNumber": 42,
  "subject": "Implement login",
  "description": "...",
  "tracker": {"id": "...", "name": "Feature"},
  "status": {"id": "...", "name": "In Progress"},
  "priority": {"id": "...", "name": "High"},
  "assignee": {"id": "...", "name": "John"},
  "creator": {"id": "...", "name": "Jane"},
  "version": {"id": "...", "name": "v1.0"},
  "project": {"id": "...", "name": "My Project"},
  "parent": null,
  "doneRatio": 30,
  "estimatedHours": 8,
  "startDate": "2026-01-15",
  "dueDate": "2026-01-20",
  "version": 5,
  "subtasks": [...],
  "comments": [...],
  "attachments": [...],
  "watchers": [...],
  "history": [...]
}
```

---

*Ngày tạo: 2026-01-15*
