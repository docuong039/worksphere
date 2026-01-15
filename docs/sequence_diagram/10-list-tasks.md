# Sequence Diagram 10: Xem danh sách công việc (UC-22)

> **Use Case**: UC-22 - Xem danh sách công việc  
> **Module**: Task Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Task Service, Permission Service, Database |
| **Trigger** | User access tasks page |
| **Precondition** | User đã đăng nhập |
| **Postcondition** | Filtered task list displayed with pagination |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xem danh sách công việc (UC-22)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks)" as API #Orange
participant "Task\nService" as TaskService #LightGreen
participant "Permission\nService" as PermService #Pink
database "Database\n(Prisma)" as DB #LightGray

== Navigate to Tasks ==
User -> Browser: Click "Công việc" menu
Browser -> Browser: Parse URL query params\n(filters, page, sort)

== Fetch Tasks ==
Browser -> API: GET /api/tasks?projectId=&status=&page=1&...
note right of API
    Query params:
    - projectId (optional)
    - statusId, priorityId
    - assigneeId, trackerId
    - versionId
    - search (keyword)
    - startDate, dueDate
    - page, limit
    - sortBy, sortOrder
end note

== Authentication ==
API -> API: getServerSession()
API -> API: Get userId, isAdministrator

== Get Accessible Projects ==
API -> PermService: getAccessibleProjects(userId)

alt isAdministrator
    PermService --> API: null (all projects)
else Normal user
    PermService -> DB: SELECT projectId FROM ProjectMember\nWHERE userId = ?
    DB --> PermService: projectIds[]
    PermService --> API: projectIds
end

== Build Query ==
API -> TaskService: getTasks(filters, pagination, accessibleProjectIds)

TaskService -> TaskService: Build WHERE clause
note right of TaskService
    WHERE projectId IN (accessibleProjectIds)
    AND statusId = ? (if provided)
    AND priorityId = ? (if provided)
    AND (subject LIKE '%search%' 
         OR description LIKE '%search%')
    AND ...other filters
end note

== Filter Private Tasks ==
TaskService -> TaskService: Add private filter
note right of TaskService
    AND (
        isPrivate = false
        OR creatorId = userId
        OR assigneeId = userId
    )
end note

== Execute Query ==
TaskService -> DB: SELECT t.*, \n  tracker.name, status.name, priority.name,\n  assignee.name, project.name\nFROM Task t\nLEFT JOIN ... (relations)\nWHERE (filters)\nORDER BY (sortBy) (sortOrder)\nLIMIT ? OFFSET ?
DB --> TaskService: tasks[]

== Get Total Count ==
TaskService -> DB: SELECT COUNT(*) FROM Task WHERE (same filters)
DB --> TaskService: totalCount

== Response ==
TaskService --> API: {tasks, total, page, limit}
API --> Browser: 200 OK

Browser -> Browser: Render task table
Browser -> Browser: Setup pagination
Browser --> User: Display task list

== Apply Filter ==
User -> Browser: Select filter (e.g., Status)
Browser -> Browser: Update URL query params
Browser -> API: GET /api/tasks?...updated filters
note right of Browser
    Repeat flow above
end note

@enduml
```

---

## 3. Filter Parameters

| Param | Type | Description |
|-------|------|-------------|
| projectId | UUID | Filter by project |
| statusId | UUID | Filter by status |
| priorityId | UUID | Filter by priority |
| trackerId | UUID | Filter by tracker |
| assigneeId | UUID | Filter by assignee |
| versionId | UUID | Filter by version |
| search | string | Search in subject/description |
| startDateFrom | date | Start date range |
| dueDateTo | date | Due date range |
| isOpen | boolean | Only open tasks |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 25) |
| sortBy | string | Sort field (default: createdAt) |
| sortOrder | asc/desc | Sort direction |

---

## 4. Request/Response

### Request
```http
GET /api/tasks?projectId=uuid&statusId=uuid&page=1&limit=25&sortBy=dueDate&sortOrder=asc
```

### Response
```http
HTTP/1.1 200 OK

{
  "tasks": [
    {
      "id": "task-uuid",
      "taskNumber": 42,
      "subject": "Task title",
      "tracker": {"name": "Bug"},
      "status": {"name": "In Progress"},
      "priority": {"name": "High"},
      "assignee": {"name": "John"},
      "dueDate": "2026-01-20"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

---

*Ngày tạo: 2026-01-15*
