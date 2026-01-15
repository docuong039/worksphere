# Sequence Diagram 03: Xóa dự án (UC-12)

> **Use Case**: UC-12 - Xóa dự án  
> **Module**: Project Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Permission Service, Project Service, Database |
| **Trigger** | User confirm delete project |
| **Precondition** | User là Creator hoặc Admin |
| **Postcondition** | Project và tất cả related data bị xóa |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xóa dự án (UC-12)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/projects/[id])" as API #Orange
participant "Permission\nService" as PermService #Pink
participant "Project\nService" as ProjService #LightGreen
database "Database\n(Prisma)" as DB #LightGray

== Confirmation Dialog ==
User -> Browser: Click "Xóa dự án"
Browser -> Browser: Show DeleteConfirmDialog
note right of Browser
    "Hành động này không thể hoàn tác"
    "Nhập tên dự án để xác nhận"
end note

User -> Browser: Nhập tên dự án
User -> Browser: Click "Xác nhận xóa"

== Validate Confirmation ==
Browser -> Browser: Validate projectName === inputName
alt Tên không khớp
    Browser --> User: "Tên dự án không khớp"
end

== API Call ==
Browser -> API: DELETE /api/projects/{id}

== Authentication ==
API -> API: getServerSession()
alt Chưa đăng nhập
    API --> Browser: 401 Unauthorized
end

== Get Project ==
API -> DB: SELECT * FROM Project WHERE id = ?
DB --> API: project | null

alt Project không tồn tại
    API --> Browser: 404 Not Found
    Browser --> User: "Dự án không tồn tại"
end

== Permission Check ==
API -> PermService: isCreatorOrAdmin(userId, project)
PermService -> PermService: Check userId === project.creatorId

alt Không phải Creator
    PermService -> DB: SELECT isAdministrator FROM User
    DB --> PermService: user
    
    alt Không phải Admin
        PermService --> API: false
        API --> Browser: 403 Forbidden
        Browser --> User: "Bạn không có quyền xóa dự án này"
    end
end

PermService --> API: true

== Cascade Delete ==
API -> ProjService: deleteProject(projectId)

group Cascade Delete (Transaction)
    ProjService -> DB: DELETE FROM Comment\nWHERE taskId IN\n(SELECT id FROM Task WHERE projectId = ?)
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM Attachment\nWHERE taskId IN\n(SELECT id FROM Task WHERE projectId = ?)
    note right of DB
        Also delete physical files
        from public/uploads
    end note
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM Watcher\nWHERE taskId IN\n(SELECT id FROM Task WHERE projectId = ?)
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM Notification\nWHERE taskId IN\n(SELECT id FROM Task WHERE projectId = ?)
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM AuditLog\nWHERE entityType = 'Task'\nAND entityId IN (SELECT id FROM Task WHERE projectId = ?)
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM Task\nWHERE projectId = ?
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM Version\nWHERE projectId = ?
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM ProjectMember\nWHERE projectId = ?
    DB --> ProjService: deleted
    
    ProjService -> DB: DELETE FROM Project\nWHERE id = ?
    DB --> ProjService: deleted
end

== Response ==
ProjService --> API: success
API --> Browser: 200 OK
Browser -> Browser: Redirect to /projects
Browser --> User: "Đã xóa dự án thành công"

@enduml
```

---

## 3. Cascade Delete Order

| Order | Table | Condition | Notes |
|-------|-------|-----------|-------|
| 1 | Comment | taskId IN project tasks | - |
| 2 | Attachment | taskId IN project tasks | + Delete files |
| 3 | Watcher | taskId IN project tasks | - |
| 4 | Notification | taskId IN project tasks | - |
| 5 | AuditLog | entityType='Task' AND entityId IN tasks | - |
| 6 | Task | projectId = ? | Includes subtasks |
| 7 | Version | projectId = ? | - |
| 8 | ProjectMember | projectId = ? | - |
| 9 | Project | id = ? | Finally |

---

## 4. Request/Response

### Request
```http
DELETE /api/projects/uuid-project-id
Cookie: next-auth.session-token=...
```

### Response (Success)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Project deleted successfully"
}
```

---

## 5. Error Responses

| Scenario | Status | Response |
|----------|--------|----------|
| Not authenticated | 401 | `{"error": "Unauthorized"}` |
| Project not found | 404 | `{"error": "Project not found"}` |
| Not creator/admin | 403 | `{"error": "Forbidden"}` |
| Database error | 500 | `{"error": "Failed to delete project"}` |

---

*Ngày tạo: 2026-01-15*
