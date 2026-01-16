# Sequence Diagram 13: Xem Dashboard (UC-49)

> **Use Case**: UC-49 - Xem Dashboard  
> **Module**: Dashboard  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Prisma |
| **API Endpoint** | GET /api/dashboard |
| **Source File** | `src/app/api/dashboard/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xem Dashboard (UC-49)
footer Based on: src/app/api/dashboard/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "GET /api/dashboard" as API #Orange
database "Prisma\n(Database)" as DB #LightGray

== Navigate to Dashboard ==
User -> Browser: Access / (home)
Browser -> API: GET /api/dashboard

== Authentication ==
API -> API: auth()
alt !session
    API --> Browser: 401 "Chưa đăng nhập"
end

API -> API: userId = session.user.id\nisAdmin = session.user.isAdministrator

== Build Project Filter ==
API -> API: projectFilter = isAdmin\n  ? {}\n  : { members: { some: { userId } } }

== Parallel Dashboard Queries ==
API -> DB: 1. My Tasks\nSELECT FROM Task\nWHERE assigneeId = userId\nAND status.isClosed = false\nORDER BY updatedAt DESC\nLIMIT 10
DB --> API: myTasks[]

API -> DB: 2. Overdue Count\nCOUNT FROM Task\nWHERE assigneeId = userId\nAND status.isClosed = false\nAND dueDate < NOW()
DB --> API: overdueTasks: number

API -> DB: 3. Due Soon Count\nCOUNT FROM Task\nWHERE assigneeId = userId\nAND status.isClosed = false\nAND dueDate BETWEEN NOW() AND NOW()+7days
DB --> API: dueSoonTasks: number

API -> DB: 4. Recent Activity\nSELECT FROM Task\nWHERE project matches projectFilter\nORDER BY updatedAt DESC\nLIMIT 10
DB --> API: recentActivity[]

API -> DB: 5. Projects Overview\nSELECT FROM Project\nWHERE projectFilter AND isArchived = false\n+ COUNT(tasks, members)\nLIMIT 5
DB --> API: projects[]

API -> DB: 6. Tasks by Status\nGROUP BY statusId\nWHERE project matches projectFilter
DB --> API: taskStats[]

API -> DB: 7. All Statuses\nSELECT id, name, isClosed\nORDER BY position
DB --> API: statuses[]

API -> DB: 8. Unread Notifications\nCOUNT FROM Notification\nWHERE userId = ? AND isRead = false
DB --> API: unreadNotifications: number

== Combine Results ==
API -> API: Map taskStats to statuses
note right of API
  tasksByStatus = statuses.map(status => ({
    status,
    count: taskStats.find(s => s.statusId === status.id)?._count || 0
  }))
end note

== Response ==
API --> Browser: 200 OK

note right of API
{
  myTasks: [...],
  overdueTasks: 3,
  dueSoonTasks: 7,
  recentActivity: [...],
  projects: [...],
  tasksByStatus: [...],
  unreadNotifications: 5
}
end note

Browser -> Browser: Render Dashboard
note right of Browser
  - My Tasks card
  - Overdue alert (red badge)
  - Due Soon warning
  - Recent Activity feed
  - Projects grid
  - Status pie/bar chart
  - Notification bell
end note

Browser --> User: Display Dashboard

@enduml
```

---

## 3. Dashboard Data Structure (từ code)

```typescript
// Return structure - Line 125-133
return successResponse({
    myTasks,           // Task[] - Assigned to me, open, limit 10
    overdueTasks,      // number - Count of overdue
    dueSoonTasks,      // number - Count due in 7 days
    recentActivity,    // Task[] - Recently updated, limit 10
    projects,          // Project[] - My projects, limit 5
    tasksByStatus,     // {status, count}[] - For pie chart
    unreadNotifications, // number - Badge count
});
```

---

## 4. Key Queries (từ code)

### My Tasks
```typescript
// Line 23-38
const myTasks = await prisma.task.findMany({
    where: {
        assigneeId: userId,
        status: { isClosed: false },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
        id: true, title: true, dueDate: true,
        status: { select: { id: true, name: true } },
        priority: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
    },
});
```

### Overdue Tasks
```typescript
// Line 41-47
const overdueTasks = await prisma.task.count({
    where: {
        assigneeId: userId,
        status: { isClosed: false },
        dueDate: { lt: new Date() },
    },
});
```

### Due Soon (7 days)
```typescript
// Line 50-61
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

const dueSoonTasks = await prisma.task.count({
    where: {
        assigneeId: userId,
        status: { isClosed: false },
        dueDate: { gte: new Date(), lte: nextWeek },
    },
});
```

---

## 5. Request/Response

### Request
```http
GET /api/dashboard
```

### Response
```json
{
  "myTasks": [
    {
      "id": "...",
      "title": "Fix login bug",
      "dueDate": "2026-01-20",
      "status": {"id": "...", "name": "In Progress"},
      "priority": {"id": "...", "name": "High", "color": "#ff0000"},
      "project": {"id": "...", "name": "Main App"}
    }
  ],
  "overdueTasks": 3,
  "dueSoonTasks": 7,
  "recentActivity": [...],
  "projects": [
    {
      "id": "...",
      "name": "Main App",
      "_count": {"tasks": 42, "members": 5}
    }
  ],
  "tasksByStatus": [
    {"status": {"id": "...", "name": "New", "isClosed": false}, "count": 10},
    {"status": {"id": "...", "name": "In Progress", "isClosed": false}, "count": 25},
    {"status": {"id": "...", "name": "Closed", "isClosed": true}, "count": 50}
  ],
  "unreadNotifications": 5
}
```

---

## 6. Dashboard Cards Mapping

| Card | Data Source | Display |
|------|-------------|---------|
| My Tasks | myTasks[] | Task list with priority colors |
| Overdue | overdueTasks | Red badge number |
| Due Soon | dueSoonTasks | Yellow badge number |
| Activity | recentActivity[] | Timeline of recent changes |
| Projects | projects[] | Project cards with progress |
| Chart | tasksByStatus[] | Pie or bar chart |
| Bell | unreadNotifications | Notification bell badge |

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
