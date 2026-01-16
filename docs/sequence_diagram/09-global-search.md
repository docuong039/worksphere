# Sequence Diagram 09: Tìm kiếm toàn cục (UC-44)

> **Use Case**: UC-44 - Tìm kiếm toàn cục  
> **Module**: Global Search  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Database |
| **API Endpoint** | GET /api/search |
| **Source File** | `src/app/api/search/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Tìm kiếm toàn cục (UC-44)
footer Based on: src/app/api/search/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "GET /api/search" as API #Orange
database "Prisma\n(Database)" as DB #LightGray

== Open Search ==
User -> Browser: Press Ctrl+K
Browser -> Browser: Open SearchModal

== Type Query ==
User -> Browser: Type keyword
Browser -> Browser: Debounce

alt query.length < 2
    Browser -> Browser: Show "Nhập ít nhất 2 ký tự"
end

Browser -> API: GET /api/search?q={keyword}&type=all

== Authentication ==
API -> API: auth() - getServerSession()
alt Chưa đăng nhập
    API --> Browser: 401 "Chưa đăng nhập"
end

== Validate Query ==
alt query.trim().length < 2
    API --> Browser: 400 "Query phải có ít nhất 2 ký tự"
end

== Build Project Filter ==
API -> API: Determine projectFilter
note right of API
  isAdmin: {} (no filter)
  non-admin: { members: { some: { userId } } }
end note

== Search Tasks ==
API -> DB: SELECT tasks WHERE\n  (title contains query OR description contains query)\n  AND project matches projectFilter
note right of DB
  Includes:
  - title, status, priority
  - project, assignee
  LIMIT 20
end note
DB --> API: tasks[]

== Search Projects ==
API -> DB: SELECT projects WHERE\n  (name contains query OR identifier contains query\n   OR description contains query)\n  AND matches projectFilter\n  AND isArchived = false
note right of DB
  LIMIT 10
end note
DB --> API: projects[]

== Search Comments ==
API -> DB: SELECT comments WHERE\n  content contains query\n  AND task.project matches projectFilter
note right of DB
  Includes: user, task
  LIMIT 10
end note
DB --> API: comments[]

== Search Users ==
alt isAdministrator
    API -> DB: SELECT users WHERE\n  (name contains query OR email contains query)\n  AND isActive = true
    note right of DB
      Full user search
      LIMIT 10
    end note
    DB --> API: users[]
else Non-admin
    API -> DB: SELECT projectMembers WHERE\n  project has current user as member\n  AND user matches query
    note right of DB
      Only users in same projects
      Deduplicated
      LIMIT 10
    end note
    DB --> API: users[]
end

== Aggregate Response ==
API -> API: Build response with counts

API --> Browser: 200 OK
note right of API
  {
    query: "keyword",
    results: {tasks, projects, comments, users},
    counts: {tasks: 5, projects: 2, ...}
  }
end note

Browser -> Browser: Render grouped results
Browser --> User: Display results

== Navigate ==
User -> Browser: Click on result
Browser -> Browser: Navigate to entity

@enduml
```

---

## 3. Project Filter Logic (từ code)

```typescript
// Line 28-30
const projectFilter = isAdmin
    ? {}  // Admin sees all
    : { members: { some: { userId } } };  // Only member projects
```

---

## 4. User Search Logic (từ code)

```typescript
// Admin: Full search
if (isAdmin) {
    results.users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: searchQuery } },
                { email: { contains: searchQuery } },
            ],
            isActive: true,
        },
        take: 10,
    });
} else {
    // Non-admin: Only users in same projects
    const projectMembers = await prisma.projectMember.findMany({
        where: {
            project: { members: { some: { userId } } },
            user: {
                OR: [
                    { name: { contains: searchQuery } },
                    { email: { contains: searchQuery } },
                ],
                isActive: true,
            },
        },
        ...
    });
    // Deduplicate users
    const uniqueUsers = new Map();
    projectMembers.forEach((pm) => {
        if (!uniqueUsers.has(pm.user.id)) {
            uniqueUsers.set(pm.user.id, pm.user);
        }
    });
    results.users = Array.from(uniqueUsers.values());
}
```

---

## 5. Request/Response

### Request
```http
GET /api/search?q=login&type=all
```

### Response
```json
{
  "query": "login",
  "results": {
    "tasks": [
      {
        "id": "task-uuid",
        "title": "Implement login feature",
        "status": {"name": "In Progress", "isClosed": false},
        "priority": {"name": "High", "color": "#ff0000"},
        "project": {"id": "...", "name": "My Project"},
        "assignee": {"id": "...", "name": "John"}
      }
    ],
    "projects": [...],
    "comments": [...],
    "users": [...]
  },
  "counts": {
    "tasks": 5,
    "projects": 2,
    "comments": 3,
    "users": 1
  }
}
```

---

## 6. Key Differences from Generic Design

| Aspect | Generic | Actual Code |
|--------|---------|-------------|
| User search | Admin only | Non-admin CAN search users in same projects |
| Query method | ILIKE | `contains` (Prisma) |
| Private task filter | Explicit | NOT implemented in search (potential issue) |
| Type filter | All | Supports `?type=tasks\|projects\|comments\|users\|all` |

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
