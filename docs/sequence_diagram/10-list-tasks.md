# Sequence Diagram 10: Xem danh sách công việc (UC-22)

> **Use Case**: UC-22 - Xem danh sách công việc  
> **Module**: Task Management  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Permission Service, Prisma |
| **API Endpoint** | GET /api/tasks |
| **Source File** | `src/app/api/tasks/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xem danh sách công việc (UC-22)
footer Based on: src/app/api/tasks/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "GET /api/tasks" as API #Orange
participant "getAccessibleProjectIds()" as PermService #Pink
database "Prisma\n(Database)" as DB #LightGray

== Navigate to Tasks ==
User -> Browser: Click "Công việc" menu
Browser -> API: GET /api/tasks?page=1&pageSize=50&sortBy=updatedAt

== Authentication ==
API -> API: auth()
alt !session
    API --> Browser: 401 "Chưa đăng nhập"
end

== Parse Query Params ==
API -> API: Parse filters from searchParams
note right of API
  page, pageSize, sortBy, sortOrder
  projectId, statusId, priorityId
  trackerId, assigneeId, creatorId
  versionId, parentId, isClosed
  search, startDateFrom/To, dueDateFrom/To
  my, assignedToMe, createdByMe
end note

== Get Accessible Projects ==
API -> PermService: getAccessibleProjectIds(\n  userId, 'tasks.view_project')

PermService -> DB: SELECT isAdministrator FROM User
DB --> PermService: user

alt isAdministrator
    PermService -> DB: SELECT id FROM Project\nWHERE isArchived = false
    DB --> PermService: allProjectIds[]
    PermService --> API: allProjectIds
else Normal user
    PermService -> DB: SELECT roleId FROM Role\nWHERE permissions.some('tasks.view_project')
    DB --> PermService: rolesWithPermission[]
    
    PermService -> DB: SELECT projectId FROM ProjectMember\nWHERE userId = ?\nAND roleId IN rolesWithPermission\nAND project.isArchived = false
    DB --> PermService: projectIds[]
    PermService --> API: projectIds
end

== Check Explicit Project ==
opt requestedProjectId provided
    API -> API: Verify projectId in allowedProjectIds
    alt Not allowed
        API --> Browser: 403 "Bạn không có quyền xem\ncông việc trong dự án này"
    end
end

alt No accessible projects
    API --> Browser: 200 {tasks: [], pagination: {total: 0}}
end

== Build WHERE Clause ==
API -> API: Build Prisma where filter
note right of API
  Key filters:
  1. projectId IN effectiveProjectIds
  2. Private tasks: OR [
       {isPrivate: false},
       {isPrivate: true, creatorId: userId},
       {isPrivate: true, assigneeId: userId}
     ]
  3. Standard filters (statusId, etc.)
  4. "My" quick filters
  5. Text search in title/description
  6. Date range filters
end note

== Execute Parallel Queries ==
API -> DB: Promise.all([\n  findMany(where, orderBy, skip, take),\n  count(where),\n  aggregate(_sum: estimatedHours)\n])
DB --> API: [tasks[], total, aggregations]

== Response ==
API --> Browser: 200 OK

note right of API
  {
    tasks: [...],
    pagination: {page, pageSize, total, totalPages},
    aggregations: {totalHours}
  }
end note

Browser -> Browser: Render task table
Browser --> User: Display tasks

@enduml
```

---

## 3. Accessible Projects Logic (từ code)

```typescript
// src/lib/permissions.ts - getAccessibleProjectIds()
export async function getAccessibleProjectIds(
    userId: string,
    permissionKey: string
): Promise<string[]> {
    const user = await prisma.user.findUnique({...});

    // Admin has access to all
    if (user.isAdministrator) {
        const projects = await prisma.project.findMany({
            where: { isArchived: false },
        });
        return projects.map(p => p.id);
    }

    // Get roles that have the permission
    const rolesWithPermission = await prisma.role.findMany({
        where: {
            permissions: {
                some: { permission: { key: permissionKey } }
            },
            isActive: true
        },
    });

    // Get user's memberships with those roles
    const memberships = await prisma.projectMember.findMany({
        where: {
            userId,
            roleId: { in: rolesWithPermission.map(r => r.id) },
            project: { isArchived: false }
        },
    });

    return memberships.map(m => m.projectId);
}
```

---

## 4. Private Task Filter (từ code)

```typescript
// Line 56-63
if (!session.user.isAdministrator) {
    where.OR = [
        { isPrivate: false },
        { isPrivate: true, creatorId: userId },
        { isPrivate: true, assigneeId: userId },
    ];
}
```

> **Admin**: Xem được tất cả private tasks
> **User**: Chỉ xem private tasks mà mình là creator hoặc assignee

---

## 5. Quick Filters

| Param | Filter Logic |
|-------|--------------|
| `my=true` | assigneeId = userId OR creatorId = userId |
| `assignedToMe=true` | assigneeId = userId |
| `createdByMe=true` | creatorId = userId |

---

## 6. Request/Response

### Request
```http
GET /api/tasks?projectId=xxx&statusId=yyy&page=1&pageSize=25&sortBy=dueDate&sortOrder=asc
```

### Response
```json
{
  "tasks": [
    {
      "id": "...",
      "number": 42,
      "title": "...",
      "tracker": {"id": "...", "name": "Bug"},
      "status": {"id": "...", "name": "In Progress", "isClosed": false},
      "priority": {"id": "...", "name": "High", "color": "#ff0000"},
      "project": {"id": "...", "name": "...", "identifier": "..."},
      "assignee": {"id": "...", "name": "...", "avatar": "..."},
      "subtasks": [...],
      "_count": {"subtasks": 2, "comments": 5}
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 150,
    "totalPages": 6
  },
  "aggregations": {
    "totalHours": 120.5
  }
}
```

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
