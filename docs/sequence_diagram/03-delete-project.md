# Sequence Diagram 03: Xóa dự án (UC-12)

> **Use Case**: UC-12 - Xóa dự án  
> **Module**: Project Management  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Prisma |
| **API Endpoint** | DELETE /api/projects/[id] |
| **Source File** | `src/app/api/projects/[id]/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xóa dự án (UC-12)
footer Based on: src/app/api/projects/[id]/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "DELETE\n/api/projects/[id]" as API #Orange
database "Prisma\n(Database)" as DB #LightGray

== Confirmation ==
User -> Browser: Click "Xóa dự án"
Browser -> Browser: Show confirm dialog
User -> Browser: Confirm delete

Browser -> API: DELETE /api/projects/{id}

== Authentication ==
API -> API: auth()
alt !session
    API --> Browser: 401 "Chưa đăng nhập"
end

== Permission Check: canManageProject ==
API -> API: canManageProject(userId, projectId, isAdmin)

alt isAdmin
    API -> API: return true
else !isAdmin
    API -> DB: SELECT creatorId FROM Project\nWHERE id = ?
    DB --> API: project
    
    API -> API: Check project.creatorId === userId
    
    alt Không phải Creator
        API --> Browser: 403 "Không có quyền xóa dự án này"
    end
end

== Get Project Info (for log) ==
API -> DB: SELECT name, identifier FROM Project\nWHERE id = ?
DB --> API: projectToDelete

== Cascade Delete ==
note over API, DB
  Xóa theo thứ tự để tránh FK constraint
  (Không dùng transaction trong code hiện tại)
end note

API -> DB: 1. DELETE FROM Comment\nWHERE task.projectId = ?
DB --> API: deleted

API -> DB: 2. DELETE FROM Attachment\nWHERE task.projectId = ?
DB --> API: deleted

API -> DB: 3. DELETE FROM Watcher\nWHERE task.projectId = ?
DB --> API: deleted

API -> DB: 4. DELETE FROM Task\nWHERE projectId = ?
DB --> API: deleted

API -> DB: 5. DELETE FROM ProjectMember\nWHERE projectId = ?
DB --> API: deleted

API -> DB: 6. DELETE FROM Project\nWHERE id = ?
DB --> API: deleted

== Audit Log ==
API -> DB: INSERT INTO AuditLog\n(action='deleted', entityType='project',\nchanges={old: {name, identifier}})
DB --> API: auditLog

== Response ==
API --> Browser: 200 OK\n{message: "Đã xóa dự án và tất cả dữ liệu liên quan"}

Browser --> User: Redirect to /projects

@enduml
```

---

## 3. canManageProject Logic (từ code)

```typescript
// src/app/api/projects/[id]/route.ts - Line 24-33
async function canManageProject(userId: string, projectId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { creatorId: true },
    });

    return project?.creatorId === userId;
}
```

> **Chú ý**: Chỉ **Creator** hoặc **Admin** mới được xóa project. Không có permission-based check như `projects.delete`.

---

## 4. Cascade Delete Order (từ code)

```typescript
// Line 213-242
// 1. Xóa comments của tasks
await prisma.comment.deleteMany({
    where: { task: { projectId: id } },
});

// 2. Xóa attachments của tasks
await prisma.attachment.deleteMany({
    where: { task: { projectId: id } },
});

// 4. Xóa watchers của tasks
await prisma.watcher.deleteMany({
    where: { task: { projectId: id } },
});

// 5. Xóa tasks
await prisma.task.deleteMany({
    where: { projectId: id },
});

// 6. Xóa project members
await prisma.projectMember.deleteMany({
    where: { projectId: id },
});

// 7. Xóa project
await prisma.project.delete({
    where: { id },
});
```

---

## 5. Missing Cascade (Potential Issues)

| Table | Status | Notes |
|-------|--------|-------|
| Comment | ✅ Deleted | - |
| Attachment | ✅ Deleted | Physical files NOT deleted! |
| Watcher | ✅ Deleted | - |
| Task | ✅ Deleted | - |
| ProjectMember | ✅ Deleted | - |
| Version | ❌ **NOT deleted** | May cause FK constraint error |
| Notification | ❌ **NOT deleted** | Orphaned notifications |
| AuditLog | ❌ **NOT deleted** | Intentional - keep history |
| ProjectTracker | ❌ **NOT deleted** | May cause orphaned records |

---

## 6. Request/Response

### Request
```http
DELETE /api/projects/project-uuid
```

### Success Response (200)
```json
{
  "message": "Đã xóa dự án và tất cả dữ liệu liên quan"
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 403 | Not creator and not admin |
| 404 | Project not found |

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
