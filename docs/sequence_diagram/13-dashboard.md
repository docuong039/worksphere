# Sequence Diagram 13: Xem Dashboard (UC-49)

> **Use Case**: UC-49 - Xem Dashboard  
> **Module**: Dashboard  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Dashboard Service, Database |
| **Trigger** | User access home page |
| **Precondition** | User đã đăng nhập |
| **Postcondition** | Dashboard with aggregated data displayed |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xem Dashboard (UC-49)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/dashboard)" as API #Orange
participant "Dashboard\nService" as DashService #LightGreen
database "Database\n(Prisma)" as DB #LightGray

== Navigate to Dashboard ==
User -> Browser: Access / (home)
Browser -> API: GET /api/dashboard

== Authentication ==
API -> API: getServerSession()
API -> API: Get userId, isAdministrator

== Get User's Projects ==
API -> DB: SELECT projectId FROM ProjectMember\nWHERE userId = ?
DB --> API: projectIds[]

== Aggregate Dashboard Data ==
API -> DashService: getDashboardData(userId, projectIds)

par Parallel Queries
    group My Assigned Tasks
        DashService -> DB: SELECT * FROM Task\nWHERE assigneeId = ?\nAND status.isClosed = false\nORDER BY dueDate ASC\nLIMIT 10
        DB --> DashService: myTasks[]
    end
and
    group Overdue Tasks
        DashService -> DB: SELECT * FROM Task\nWHERE assigneeId = ?\nAND dueDate < NOW()\nAND status.isClosed = false
        DB --> DashService: overdueTasks[]
    end
and
    group Upcoming Tasks (7 days)
        DashService -> DB: SELECT * FROM Task\nWHERE assigneeId = ?\nAND dueDate BETWEEN NOW() AND NOW()+7days\nAND status.isClosed = false\nORDER BY dueDate ASC
        DB --> DashService: upcomingTasks[]
    end
and
    group Recent Activity
        DashService -> DB: SELECT al.*, u.name, t.taskNumber\nFROM AuditLog al\nJOIN User u ON al.userId = u.id\nLEFT JOIN Task t ON al.entityId = t.id\nWHERE al.entityType = 'Task'\nAND (task.projectId IN projectIds)\nORDER BY al.createdAt DESC\nLIMIT 10
        DB --> DashService: recentActivity[]
    end
and
    group Statistics by Status
        DashService -> DB: SELECT s.name, COUNT(t.id) as count\nFROM Task t\nJOIN Status s ON t.statusId = s.id\nWHERE t.projectId IN (?)\nGROUP BY s.id
        DB --> DashService: statsByStatus[]
    end
and
    group My Projects Overview
        DashService -> DB: SELECT p.*, \n  COUNT(t.id) as totalTasks,\n  COUNT(CASE WHEN s.isClosed THEN 1 END) as closedTasks\nFROM Project p\nJOIN ProjectMember pm ON p.id = pm.projectId\nLEFT JOIN Task t ON p.id = t.projectId\nLEFT JOIN Status s ON t.statusId = s.id\nWHERE pm.userId = ?\nGROUP BY p.id
        DB --> DashService: projectOverview[]
    end
end

== Assemble Dashboard ==
DashService -> DashService: Combine all data
DashService --> API: dashboardData

API --> Browser: 200 OK\n{dashboard}

Browser -> Browser: Render Dashboard components
note right of Browser
    - TasksAssignedToMe card
    - OverdueTasks alert
    - UpcomingDeadlines timeline
    - RecentActivity feed
    - StatusChart (pie/bar)
    - ProjectsOverview grid
end note

Browser --> User: Display Dashboard

@enduml
```

---

## 3. Dashboard Components

| Component | Data Source | Description |
|-----------|-------------|-------------|
| My Tasks | Tasks assigned to me | Open tasks list |
| Overdue | dueDate < NOW() | Alert/warning list |
| Upcoming | dueDate within 7 days | Timeline view |
| Activity Feed | AuditLog | Recent changes |
| Status Chart | Group by status | Pie/Bar chart |
| Projects | ProjectMember + stats | Project cards |

---

## 4. Request/Response

### Request
```http
GET /api/dashboard
```

### Response
```http
HTTP/1.1 200 OK

{
  "myTasks": [
    {"id": "...", "taskNumber": 42, "subject": "...", "dueDate": "..."}
  ],
  "overdueTasks": [
    {"id": "...", "taskNumber": 15, "subject": "...", "dueDate": "2026-01-10"}
  ],
  "upcomingTasks": [...],
  "recentActivity": [
    {
      "id": "...",
      "action": "updated",
      "user": "John",
      "taskNumber": 42,
      "fieldName": "status",
      "newValue": "In Progress",
      "createdAt": "..."
    }
  ],
  "statistics": {
    "byStatus": [
      {"name": "New", "count": 10},
      {"name": "In Progress", "count": 25},
      {"name": "Closed", "count": 50}
    ],
    "total": 85,
    "open": 35,
    "closed": 50
  },
  "projects": [
    {
      "id": "...",
      "name": "Project A",
      "totalTasks": 30,
      "closedTasks": 20,
      "progress": 67
    }
  ]
}
```

---

## 5. Cache Strategy

```javascript
// Dashboard data can be cached for 1-5 minutes
const CACHE_TTL = 60 * 1000; // 1 minute

// Use SWR for client-side caching
const { data } = useSWR('/api/dashboard', fetcher, {
  refreshInterval: CACHE_TTL,
  revalidateOnFocus: true
});
```

---

*Ngày tạo: 2026-01-15*
