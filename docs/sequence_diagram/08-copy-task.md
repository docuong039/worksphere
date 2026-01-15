# Sequence Diagram 08: Sao chép công việc (UC-41)

> **Use Case**: UC-41 - Sao chép công việc  
> **Module**: Task Copy  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Permission Service, Copy Service, Task Service, Database |
| **Trigger** | User submit copy task form |
| **Precondition** | User có quyền `tasks.create` ở project đích |
| **Postcondition** | New task created, Subtasks copied (optional) |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Sao chép công việc (UC-41)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks/[id]/copy)" as API #Orange
participant "Permission\nService" as PermService #Pink
participant "Copy\nService" as CopyService #LightGreen
participant "Task\nService" as TaskService #Yellow
database "Database\n(Prisma)" as DB #LightGray

== Open Copy Dialog ==
User -> Browser: Click "Sao chép"
Browser -> API: GET /api/tasks/{id}
API --> Browser: sourceTask

Browser -> API: GET /api/projects?member=true
API --> Browser: userProjects[]

Browser -> Browser: Show CopyTaskDialog\n(prefilled with sourceTask data)

== Configure Copy ==
User -> Browser: Select target project
User -> Browser: Modify fields (optional)
User -> Browser: Check/Uncheck "Sao chép công việc con"
User -> Browser: Click "Sao chép"

Browser -> API: POST /api/tasks/{id}/copy\n{targetProjectId, data, copySubtasks}

== Authentication ==
API -> API: getServerSession()

== Permission Check ==
API -> PermService: hasPermission(userId, targetProjectId, "tasks.create")
PermService -> DB: SELECT permissions
DB --> PermService: permissions[]

alt Không có quyền ở project đích
    PermService --> API: false
    API --> Browser: 403 Forbidden
    Browser --> User: "Bạn không có quyền tạo công việc trong dự án này"
end

== Get Source Task ==
API -> CopyService: copyTask(sourceTaskId, targetProjectId, data, options)
CopyService -> DB: SELECT * FROM Task WHERE id = ?
DB --> CopyService: sourceTask

== Generate New Task Number ==
CopyService -> TaskService: generateTaskNumber(targetProjectId)
TaskService -> DB: SELECT MAX(taskNumber) FROM Task\nWHERE projectId = ?
DB --> TaskService: maxNumber
TaskService --> CopyService: newTaskNumber

== Create Copied Task ==
CopyService -> CopyService: Prepare task data
note right of CopyService
    Copy all fields except:
    - id (generate new)
    - taskNumber (generate new)
    - projectId (use target)
    - parentId (null for main task)
    - createdAt, updatedAt (new)
    - version (reset to 1)
end note

CopyService -> DB: INSERT INTO Task (new data)
DB --> CopyService: newTask

== Copy Subtasks (optional) ==
opt options.copySubtasks = true
    CopyService -> DB: SELECT * FROM Task\nWHERE parentId = sourceTaskId
    DB --> CopyService: subtasks[]
    
    loop For each subtask
        CopyService -> TaskService: generateTaskNumber(targetProjectId)
        TaskService --> CopyService: subtaskNumber
        
        CopyService -> DB: INSERT INTO Task\n(subtask data with new parentId)
        DB --> CopyService: newSubtask
    end
end

== Response ==
CopyService --> API: newTask (with subtasks if copied)
API --> Browser: 201 Created\n{task}

Browser -> Browser: Close dialog
Browser --> User: Redirect to new task

@enduml
```

---

## 3. Copy Field Mapping

| Field | Source | Target | Behavior |
|-------|--------|--------|----------|
| id | source.id | UUID.new() | Generate new |
| taskNumber | source.taskNumber | max+1 | Generate per project |
| projectId | source.projectId | targetProjectId | Use target |
| subject | source.subject | copied | Copy |
| description | source.description | copied | Copy |
| trackerId | source.trackerId | mapped* | Map if exists in target |
| statusId | source.statusId | mapped* | Map or use default |
| priorityId | source.priorityId | copied | Copy |
| assigneeId | source.assigneeId | null/mapped | Clear or map if member |
| parentId | source.parentId | null/newParentId | null for main, new for sub |
| version | any | 1 | Reset |
| createdAt | any | NOW() | New |

---

## 4. Request/Response

### Request
```http
POST /api/tasks/source-task-uuid/copy
Content-Type: application/json

{
  "targetProjectId": "target-project-uuid",
  "data": {
    "subject": "Copied: Original subject",
    "description": "..."
  },
  "options": {
    "copySubtasks": true
  }
}
```

### Response (Success)
```http
HTTP/1.1 201 Created

{
  "id": "new-task-uuid",
  "taskNumber": 15,
  "subject": "Copied: Original subject",
  "projectId": "target-project-uuid",
  "subtasks": [
    {"id": "sub1", "taskNumber": 16},
    {"id": "sub2", "taskNumber": 17}
  ]
}
```

---

*Ngày tạo: 2026-01-15*
