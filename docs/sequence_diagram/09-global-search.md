# Sequence Diagram 09: Tìm kiếm toàn cục (UC-44)

> **Use Case**: UC-44 - Tìm kiếm toàn cục  
> **Module**: Global Search  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Search Service, Permission Service, Database |
| **Trigger** | User type in global search (Ctrl+K) |
| **Precondition** | User đã đăng nhập |
| **Postcondition** | Results filtered by permission, grouped by type |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Tìm kiếm toàn cục (UC-44)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/search)" as API #Orange
participant "Search\nService" as SearchService #LightGreen
participant "Permission\nService" as PermService #Pink
database "Database\n(Prisma)" as DB #LightGray

== Open Global Search ==
User -> Browser: Press Ctrl+K
Browser -> Browser: Open SearchModal

== Type Search Query ==
User -> Browser: Type keyword
Browser -> Browser: Debounce 300ms

alt keyword.length < 2
    Browser -> Browser: Show "Nhập ít nhất 2 ký tự"
end

Browser -> API: GET /api/search?q={keyword}

== Authentication ==
API -> API: getServerSession()
API -> API: Get userId, isAdministrator

== Get User's Projects ==
API -> PermService: getAccessibleProjects(userId)
PermService -> DB: SELECT projectId FROM ProjectMember\nWHERE userId = ?
DB --> PermService: projectIds[]
PermService --> API: accessibleProjectIds

== Parallel Search ==
API -> SearchService: search(keyword, userId, isAdmin)

par Search Tasks
    SearchService -> DB: SELECT t.*, p.name as projectName\nFROM Task t\nJOIN Project p ON t.projectId = p.id\nWHERE (t.subject ILIKE ? OR t.description ILIKE ?)\nAND t.projectId IN (accessibleProjectIds)
    DB --> SearchService: tasks[]
and Search Projects
    SearchService -> DB: SELECT * FROM Project\nWHERE (name ILIKE ? OR identifier ILIKE ?)\nAND id IN (accessibleProjectIds)
    DB --> SearchService: projects[]
and Search Comments
    SearchService -> DB: SELECT c.*, t.taskNumber\nFROM Comment c\nJOIN Task t ON c.taskId = t.id\nWHERE c.content ILIKE ?\nAND t.projectId IN (accessibleProjectIds)
    DB --> SearchService: comments[]
end

== Filter Private Tasks ==
SearchService -> SearchService: Filter private tasks
note right of SearchService
    If task.isPrivate = true:
    Only show if userId = task.creatorId
    OR userId = task.assigneeId
end note

== Admin: Search Users ==
opt isAdministrator = true
    SearchService -> DB: SELECT * FROM User\nWHERE name ILIKE ? OR email ILIKE ?
    DB --> SearchService: users[]
end

== Group & Sort Results ==
SearchService -> SearchService: Group by type
SearchService -> SearchService: Sort by relevance/date

SearchService --> API: {tasks, projects, comments, users?}

== Response ==
API --> Browser: 200 OK\n{results}

Browser -> Browser: Render grouped results
Browser --> User: Display search results

== Navigate to Result ==
User -> Browser: Click on result
Browser -> Browser: Navigate to entity

@enduml
```

---

## 3. Search Query Building

```sql
-- Tasks (with permission filter)
SELECT t.*, p.name as projectName
FROM Task t
JOIN Project p ON t.projectId = p.id
WHERE (
    t.subject ILIKE '%keyword%' 
    OR t.description ILIKE '%keyword%'
)
AND t.projectId IN (user_project_ids)
AND (
    t.isPrivate = false 
    OR t.creatorId = userId 
    OR t.assigneeId = userId
)
ORDER BY t.updatedAt DESC
LIMIT 10;
```

---

## 4. Permission Filtering

| Entity | Filter Rule |
|--------|-------------|
| Tasks | projectId IN user's projects + private check |
| Projects | id IN user's projects |
| Comments | task.projectId IN user's projects |
| Users | Admin only |

---

## 5. Request/Response

### Request
```http
GET /api/search?q=login&limit=20
```

### Response
```http
HTTP/1.1 200 OK

{
  "tasks": [
    {
      "id": "task-uuid",
      "taskNumber": 42,
      "subject": "Implement login feature",
      "projectName": "My Project",
      "status": "In Progress"
    }
  ],
  "projects": [
    {
      "id": "project-uuid",
      "name": "Login System",
      "identifier": "login-system"
    }
  ],
  "comments": [
    {
      "id": "comment-uuid",
      "content": "...login button should...",
      "taskNumber": 15
    }
  ],
  "users": []
}
```

---

*Ngày tạo: 2026-01-15*
