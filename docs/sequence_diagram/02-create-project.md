# Sequence Diagram 02: Tạo dự án (UC-10)

> **Use Case**: UC-10 - Tạo dự án mới  
> **Module**: Project Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Permission Service, Project Service, Database |
| **Trigger** | User submit create project form |
| **Precondition** | User có quyền `projects.create` |
| **Postcondition** | Project được tạo, Creator thành member với role Manager |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Tạo dự án mới (UC-10)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/projects)" as API #Orange
participant "Permission\nService" as PermService #Pink
participant "Project\nService" as ProjService #LightGreen
database "Database\n(Prisma)" as DB #LightGray

== Khởi tạo Form ==
User -> Browser: Click "Tạo dự án mới"
Browser -> Browser: Mở CreateProjectModal

== Submit Form ==
User -> Browser: Nhập: name, identifier, description, dates
User -> Browser: Click "Tạo"
Browser -> API: POST /api/projects\n{name, identifier, description, startDate, endDate}

== Authentication Check ==
API -> API: getServerSession()
alt Chưa đăng nhập
    API --> Browser: 401 Unauthorized
    Browser --> User: Redirect to /login
end

== Permission Check ==
API -> PermService: hasPermission(userId, null, "projects.create")
PermService -> DB: SELECT isAdministrator FROM User WHERE id = ?
DB --> PermService: user

alt isAdministrator = true
    PermService --> API: true (bypass)
else isAdministrator = false
    PermService -> DB: SELECT p.key FROM Permission p\nJOIN RolePermission rp ON ...\nWHERE key = "projects.create"
    DB --> PermService: permissions[]
    
    alt Không có quyền
        PermService --> API: false
        API --> Browser: 403 Forbidden
        Browser --> User: "Bạn không có quyền tạo dự án"
    else Có quyền
        PermService --> API: true
    end
end

== Validation ==
API -> ProjService: validateProject(data)
ProjService -> ProjService: Check required fields (name, identifier)
ProjService -> ProjService: Validate identifier format\n(lowercase, alphanumeric, dashes)

alt Validation failed
    ProjService --> API: ValidationError
    API --> Browser: 400 Bad Request
    Browser --> User: Hiển thị validation errors
end

== Check Unique Identifier ==
ProjService -> DB: SELECT id FROM Project\nWHERE identifier = ?
DB --> ProjService: existingProject | null

alt Identifier đã tồn tại
    ProjService --> API: Error("Identifier already exists")
    API --> Browser: 409 Conflict
    Browser --> User: "Mã dự án đã tồn tại"
end

== Create Project ==
ProjService -> DB: INSERT INTO Project\n(name, identifier, description, startDate, endDate, creatorId)
DB --> ProjService: newProject

== Auto-assign Creator as Manager ==
ProjService -> DB: SELECT id FROM Role WHERE name = 'Manager'
DB --> ProjService: managerRoleId

ProjService -> DB: INSERT INTO ProjectMember\n(projectId, userId, roleId)
note right of DB
    userId = creator
    roleId = Manager
end note
DB --> ProjService: projectMember

== Response ==
ProjService --> API: project with member
API --> Browser: 201 Created\n{project}
Browser -> Browser: Close modal
Browser -> Browser: Refresh project list
Browser --> User: Redirect to /projects/{identifier}

@enduml
```

---

## 3. Participants Description

| Participant | File/Module | Chức năng |
|-------------|-------------|-----------|
| Browser | React Components | UI, form handling |
| API Route | /api/projects/route.ts | HTTP endpoint |
| Permission Service | lib/permissions.ts | RBAC check |
| Project Service | lib/services/project.ts | Business logic |
| Database | Prisma | Data persistence |

---

## 4. Request/Response

### Request
```http
POST /api/projects
Content-Type: application/json
Cookie: next-auth.session-token=...

{
  "name": "My Project",
  "identifier": "my-project",
  "description": "Project description",
  "startDate": "2026-01-15",
  "endDate": "2026-06-30"
}
```

### Response (Success)
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "uuid",
  "name": "My Project",
  "identifier": "my-project",
  "description": "Project description",
  "startDate": "2026-01-15T00:00:00Z",
  "endDate": "2026-06-30T00:00:00Z",
  "creatorId": "user-uuid",
  "createdAt": "2026-01-15T16:50:00Z"
}
```

---

## 5. Error Responses

| Scenario | Status | Response |
|----------|--------|----------|
| Not authenticated | 401 | `{"error": "Unauthorized"}` |
| No permission | 403 | `{"error": "Forbidden"}` |
| Validation error | 400 | `{"error": "Name is required"}` |
| Duplicate identifier | 409 | `{"error": "Identifier already exists"}` |

---

*Ngày tạo: 2026-01-15*
