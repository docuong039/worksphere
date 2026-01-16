# Sequence Diagram 04: Tạo công việc (UC-24)

> **Use Case**: UC-24 - Tạo công việc mới  
> **Module**: Task Management  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Permission Service, Task Service, Database |
| **API Endpoint** | POST /api/tasks |
| **Source File** | `src/app/api/tasks/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Tạo công việc mới (UC-24)
footer Based on: src/app/api/tasks/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "POST /api/tasks" as API #Orange
participant "checkProjectPermission()" as PermCheck #Pink
participant "updateParentAttributes()" as ParentUpdate #LightGreen
participant "logCreate()" as AuditLog #Yellow
participant "notifyTaskAssigned()" as Notify #Cyan
database "Prisma\n(Database)" as DB #LightGray

== Submit Form ==
User -> Browser: Nhập thông tin task
User -> Browser: Click "Tạo"
Browser -> API: POST /api/tasks\n{projectId, title, trackerId, statusId, ...}

== Authentication ==
API -> API: auth() - getServerSession()
alt Chưa đăng nhập
    API --> Browser: 401 "Chưa đăng nhập"
end

== Validate Input ==
API -> API: createTaskSchema.parse(body)
alt Validation failed
    API --> Browser: 400 Validation errors
end

== Permission Check ==
API -> PermCheck: checkProjectPermission(user, 'tasks.create', projectId)
PermCheck -> DB: Check isAdministrator OR\nROLE has 'tasks.create' permission
DB --> PermCheck: boolean

alt Không có quyền
    PermCheck --> API: false
    API --> Browser: 403 "Bạn không có quyền thêm công việc vào dự án này"
end

== Validate ProjectTracker ==
API -> DB: SELECT FROM ProjectTracker\nWHERE projectId = ? AND trackerId = ?
DB --> API: projectTracker | null

alt Tracker không enabled cho project
    API --> Browser: 400 "Tracker này không được kích hoạt cho dự án hiện tại"
end

== Validate RoleTracker (non-admin) ==
opt !isAdministrator
    API -> DB: SELECT roleId FROM ProjectMember\nWHERE projectId = ? AND userId = ?
    DB --> API: member
    
    API -> DB: SELECT FROM RoleTracker\nWHERE roleId = ? AND trackerId = ?
    DB --> API: roleTracker | null
    
    alt Role không được dùng Tracker này
        API --> Browser: 400 "Tracker không được hỗ trợ trong dự án này"
    end
end

== Validate Assignee ==
opt assigneeId provided
    API -> DB: SELECT FROM ProjectMember\nWHERE projectId = ? AND userId = assigneeId
    DB --> API: assigneeMember | null
    
    alt Assignee không phải member
        API --> Browser: 400 "Người thực hiện không phải là thành viên của dự án này"
    end
    
    == Check canAssignToOther ==
    opt assigneeId !== currentUserId AND !isAdmin
        API -> DB: SELECT role.canAssignToOther FROM ProjectMember\nWHERE userId = currentUser
        DB --> API: requesterMember
        
        alt canAssignToOther !== true
            API --> Browser: 403 "Bạn không có quyền giao việc cho người khác"
        end
    end
end

== Validate Parent (if subtask) ==
opt parentId provided
    API -> DB: SELECT id, projectId, level, path FROM Task\nWHERE id = parentId
    DB --> API: parent | null
    
    alt Parent không tồn tại
        API --> Browser: 400 "Không tìm thấy công việc cha"
    end
    
    alt parent.projectId !== data.projectId
        API --> Browser: 400 "Công việc cha phải thuộc cùng một dự án"
    end
    
    alt parent.level >= 4
        API --> Browser: 400 "Vượt quá độ sâu tối đa (5 cấp)"
    end
    
    API -> API: Calculate:\nlevel = parent.level + 1\npath = parent.path ? parent.path + "." + parent.id : parent.id
end

== Create Task ==
API -> DB: INSERT INTO Task (\n  projectId, title, trackerId, statusId,\n  creatorId, level, path,\n  startDate, dueDate, assigneeId,\n  parentId, versionId, estimatedHours,\n  doneRatio, isPrivate\n)
note right of DB
  - creatorId = session.user.id
  - level = calculated
  - path = calculated
  - doneRatio = body.doneRatio ?? 0
  - isPrivate = body.isPrivate ?? false
end note
DB --> API: newTask

== Notify Assignee ==
opt assigneeId !== currentUserId
    API -> Notify: notifyTaskAssigned(taskId, title, assigneeId, userName)
    Notify -> DB: INSERT Notification
end

== Audit Log ==
API -> AuditLog: logCreate('task', taskId, userId, {title, projectId})
AuditLog -> DB: INSERT AuditLog

== Update Parent (if subtask) ==
opt parentId provided
    API -> ParentUpdate: updateParentAttributes(parentId)
    
    ParentUpdate -> DB: SELECT subtasks for parent
    ParentUpdate -> ParentUpdate: Calculate:\n- startDate = MIN(subtasks.startDate)\n- dueDate = MAX(subtasks.dueDate)\n- doneRatio = weighted AVG\n- estimatedHours = SUM (if calculated)
    ParentUpdate -> DB: UPDATE parent task
    
    opt parent has grandparent
        ParentUpdate -> ParentUpdate: Recursive call for grandparent
    end
end

== Response ==
API --> Browser: 201 Created {task}
Browser --> User: Redirect to task detail

@enduml
```

---

## 3. Validation Layers (từ code)

| Layer | Check | Error |
|-------|-------|-------|
| 1 | Authentication | 401 |
| 2 | Schema validation | 400 |
| 3 | Permission 'tasks.create' | 403 |
| 4 | ProjectTracker enabled | 400 |
| 5 | RoleTracker allowed | 400 |
| 6 | Assignee is member | 400 |
| 7 | canAssignToOther check | 403 |
| 8 | Parent exists & same project | 400 |
| 9 | Max depth (5 levels) | 400 |

---

## 4. Hierarchy Calculation (từ code)

```typescript
// Line 265-282
if (validatedData.parentId) {
    const parent = await prisma.task.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true, projectId: true, level: true, path: true }
    });

    if (!parent) return errorResponse('Không tìm thấy công việc cha', 400);
    if (parent.projectId !== validatedData.projectId) {
        return errorResponse('Công việc cha phải thuộc cùng một dự án', 400);
    }
    if (parent.level >= 4) {
        return errorResponse('Vượt quá độ sâu tối đa (5 cấp)', 400);
    }

    level = parent.level + 1;
    path = parent.path ? `${parent.path}.${parent.id}` : parent.id;
}
```

---

## 5. Request/Response

### Request
```http
POST /api/tasks
Content-Type: application/json

{
  "projectId": "project-uuid",
  "title": "Implement login feature",
  "trackerId": "tracker-uuid",
  "statusId": "status-uuid",
  "priorityId": "priority-uuid",
  "assigneeId": "user-uuid",
  "parentId": null,
  "versionId": "version-uuid",
  "startDate": "2026-01-15",
  "dueDate": "2026-01-20",
  "estimatedHours": 8,
  "doneRatio": 0,
  "isPrivate": false,
  "description": "..."
}
```

### Success Response (201)
```json
{
  "id": "new-task-uuid",
  "title": "Implement login feature",
  "project": {"id": "...", "name": "...", "identifier": "..."},
  "tracker": {"id": "...", "name": "Bug"},
  "status": {"id": "...", "name": "New"},
  "assignee": {"id": "...", "name": "John"}
}
```

---

## 6. Key Differences from Generic Design

| Aspect | Generic | Actual Code |
|--------|---------|-------------|
| Task Number | Auto-increment | Uses `number` field (auto in DB) |
| Tracker validation | None | ProjectTracker + RoleTracker |
| Assignee validation | Basic | + canAssignToOther check |
| Hierarchy | Simple | path + level with max 5 levels |

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
