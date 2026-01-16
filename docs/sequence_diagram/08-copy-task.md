# Sequence Diagram 08: Sao chép công việc (UC-41)

> **Use Case**: UC-41 - Sao chép công việc  
> **Module**: Task Copy  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Prisma |
| **API Endpoint** | POST /api/tasks/[id]/copy |
| **Source File** | `src/app/api/tasks/[id]/copy/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Sao chép công việc (UC-41)
footer Based on: src/app/api/tasks/[id]/copy/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "POST /api/tasks/[id]\n/copy" as API #Orange
database "Prisma\n(Database)" as DB #LightGray

== Open Copy Dialog ==
User -> Browser: Click "Sao chép"
Browser -> Browser: Show CopyTaskDialog\n(prefill với original data)

== Configure Copy ==
User -> Browser: Select target project (optional)
User -> Browser: Check/uncheck options
User -> Browser: Click "Sao chép"

Browser -> API: POST /api/tasks/{id}/copy\n{targetProjectId, copySubtasks, copyWatchers}

== Authentication ==
API -> API: auth()
alt !session
    API --> Browser: 401 "Không được quyền truy cập"
end

== Get Original Task ==
API -> DB: SELECT * FROM Task\nWHERE id = ?\nINCLUDE subtasks, watchers, attachments
DB --> API: originalTask | null

alt Task không tồn tại
    API --> Browser: 404 "Không tìm thấy công việc"
end

== Determine Target Project ==
API -> API: projectId = targetProjectId || originalTask.projectId

== Permission Check ==
alt session.user.isAdministrator
    API -> API: canCreate = true
else
    API -> DB: SELECT * FROM ProjectMember\nWHERE projectId = ? AND userId = ?\nAND role.permissions.some('tasks.create')
    DB --> API: member | null
    
    alt Không có quyền
        API --> Browser: 403 "Bạn không có quyền tạo\ncông việc trong dự án đích"
    end
end

== Get Default Status ==
API -> DB: SELECT * FROM Status\nWHERE isDefault = true
DB --> API: defaultStatus | null

alt Không có default status
    API --> Browser: 500 "Hệ thống chưa cấu hình\ntrạng thái mặc định"
end

== Create Copied Task ==
API -> DB: INSERT INTO Task (\n  title: originalTask.title + " (Copy)",\n  description: original,\n  trackerId: original,\n  statusId: defaultStatus.id,\n  priorityId: original,\n  projectId: targetProject,\n  creatorId: currentUser,\n  estimatedHours: original,\n  doneRatio: 0,\n  startDate: original,\n  dueDate: original,\n  isPrivate: original\n)
note right of DB
  - Title có suffix "(Copy)"
  - Status reset về default
  - doneRatio reset về 0
  - Creator = current user
end note
DB --> API: copiedTask

== Copy Watchers (optional) ==
opt copyWatchers && originalTask.watchers.length > 0
    API -> DB: INSERT INTO Watcher\n({taskId: copiedTask.id, userId: w.userId})\nFOR EACH watcher
    DB --> API: watchers
end

== Copy Subtasks (optional) ==
opt copySubtasks && originalTask.subtasks.length > 0
    loop For each subtask
        API -> DB: INSERT INTO Task (\n  title: subtask.title,\n  description: subtask.description,\n  trackerId: subtask.trackerId,\n  statusId: defaultStatus.id,\n  priorityId: subtask.priorityId,\n  projectId: targetProject,\n  creatorId: currentUser,\n  parentId: copiedTask.id,\n  estimatedHours: subtask.estimatedHours,\n  doneRatio: 0,\n  level: subtask.level\n)
        DB --> API: copiedSubtask
    end
end

== Get Full Result ==
API -> DB: SELECT * FROM Task\nWHERE id = copiedTask.id\nINCLUDE tracker, status, priority, project
DB --> API: result with relations

== Response ==
API --> Browser: 201 Created {result}

Browser -> Browser: Close dialog
Browser --> User: Navigate to new task

@enduml
```

---

## 3. Copy Logic (từ code)

```typescript
// Line 68-84 - Main task copy
const copiedTask = await prisma.task.create({
    data: {
        title: `${originalTask.title} (Copy)`,  // Add suffix
        description: originalTask.description,
        trackerId: originalTask.trackerId,
        statusId: defaultStatus.id,              // Reset to default
        priorityId: originalTask.priorityId,
        projectId,                               // Target project
        creatorId: session.user.id,              // Current user
        estimatedHours: originalTask.estimatedHours,
        doneRatio: 0,                            // Reset to 0
        startDate: originalTask.startDate,
        dueDate: originalTask.dueDate,
        isPrivate: originalTask.isPrivate,
    },
});
```

---

## 4. What Gets Copied

| Field | Copied? | Notes |
|-------|---------|-------|
| title | ✅ + "(Copy)" | Suffix added |
| description | ✅ | As-is |
| trackerId | ✅ | As-is |
| statusId | ❌ Reset | Uses defaultStatus |
| priorityId | ✅ | As-is |
| projectId | ⚙️ | Target or original |
| creatorId | ❌ New | Current user |
| assigneeId | ❌ | NOT copied |
| estimatedHours | ✅ | As-is |
| doneRatio | ❌ Reset | Always 0 |
| startDate | ✅ | As-is |
| dueDate | ✅ | As-is |
| isPrivate | ✅ | As-is |
| versionId | ❌ | NOT copied |
| parentId | ❌ | NOT copied (top-level) |

---

## 5. Copy Options

| Option | Default | Description |
|--------|---------|-------------|
| targetProjectId | original | Copy to same or different project |
| copySubtasks | false | Copy subtasks with new parentId |
| copyWatchers | false | Copy watcher list |
| copyAttachments | ❌ N/A | NOT implemented in code |

---

## 6. Request/Response

### Request
```http
POST /api/tasks/original-task-uuid/copy
Content-Type: application/json

{
  "targetProjectId": "target-project-uuid",
  "copySubtasks": true,
  "copyWatchers": false
}
```

### Success Response (201)
```json
{
  "id": "new-task-uuid",
  "title": "Original Title (Copy)",
  "status": {"name": "New", "isDefault": true},
  "project": {"id": "...", "name": "..."},
  "_count": {"subtasks": 2}
}
```

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
