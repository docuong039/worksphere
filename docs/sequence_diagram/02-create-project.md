# Sequence Diagram 02: Tạo dự án (UC-10)

> **Use Case**: UC-10 - Tạo dự án mới  
> **Module**: Project Management  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API Route, Prisma |
| **API Endpoint** | POST /api/projects |
| **Source File** | `src/app/api/projects/route.ts` |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Tạo dự án mới (UC-10)
footer Based on: src/app/api/projects/route.ts

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "POST /api/projects" as API #Orange
database "Prisma\n(Database)" as DB #LightGray

== Submit Form ==
User -> Browser: Nhập: name, identifier, description, dates
User -> Browser: Click "Tạo dự án"
Browser -> API: POST /api/projects\n{name, identifier, description, startDate, endDate}

== Authentication ==
API -> API: auth() - getServerSession()
alt !session
    API --> Browser: 401 "Chưa đăng nhập"
end

== Permission Check ==
alt !session.user.isAdministrator
    API -> API: checkPermission(userId, 'projects.create')
    
    API -> DB: SELECT role.permissions FROM ProjectMember\nWHERE userId = ?
    note right of DB
      Check nếu bất kỳ role nào
      có permission 'projects.create'
    end note
    DB --> API: permissions[]
    
    API -> API: Check 'projects.create' in any role
    
    alt Không có quyền
        API --> Browser: 403 "Không có quyền tạo dự án"
    end
end

== Validate Input ==
API -> API: createProjectSchema.parse(body)
note right of API
  - name: required, max 100
  - identifier: required, lowercase + numbers + dashes
  - description: optional
  - startDate, endDate: optional
end note

alt Validation failed
    API --> Browser: 400 Validation errors
end

== Check Unique Identifier ==
API -> DB: SELECT * FROM Project\nWHERE identifier = ?
DB --> API: existing | null

alt Identifier đã tồn tại
    API --> Browser: 400 "Định danh dự án đã tồn tại"
end

== Get Manager Role ==
API -> DB: SELECT * FROM Role\nWHERE name = 'Manager'
DB --> API: managerRole | null

== Create Project + Add Creator as Member ==
API -> DB: INSERT INTO Project (\n  name, description, identifier,\n  startDate, endDate, creatorId\n)\n+ INSERT INTO ProjectMember (\n  projectId, userId, roleId = Manager\n)
note right of DB
  Nested create:
  Creator tự động làm member
  với role Manager
end note
DB --> API: project with members

== Enable All Trackers ==
API -> DB: SELECT id FROM Tracker
DB --> API: allTrackers[]

API -> DB: INSERT INTO ProjectTracker\n(projectId, trackerId) FOR EACH tracker
note right of DB
  Mặc định enable tất cả
  trackers cho project mới
end note
DB --> API: projectTrackers[]

== Audit Log ==
API -> DB: INSERT INTO AuditLog\n(action='created', entityType='project', ...)
DB --> API: auditLog

== Response ==
API --> Browser: 201 Created {project}
Browser --> User: Redirect to /projects/{identifier}

@enduml
```

---

## 3. Permission Check Logic (từ code)

```typescript
// src/app/api/projects/route.ts - Line 88-93
if (!session.user.isAdministrator) {
    const hasPermission = await checkPermission(session.user.id, 'projects.create');
    if (!hasPermission) {
        return errorResponse('Không có quyền tạo dự án', 403);
    }
}

// Helper function - Line 170-192
async function checkPermission(userId: string, permissionKey: string): Promise<boolean> {
    const memberships = await prisma.projectMember.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    for (const membership of memberships) {
        const hasPermission = membership.role.permissions.some(
            (rp) => rp.permission.key === permissionKey
        );
        if (hasPermission) return true;
    }

    return false;
}
```

> **Note**: `projects.create` được check xem user có permission này trong **bất kỳ project nào** (không phải project-specific).

---

## 4. Auto-enable Trackers (từ code)

```typescript
// Line 146-155
const allTrackers = await prisma.tracker.findMany({ select: { id: true } });
if (allTrackers.length > 0) {
    await prisma.projectTracker.createMany({
        data: allTrackers.map(t => ({
            projectId: project.id,
            trackerId: t.id
        }))
    });
}
```

---

## 5. Request/Response

### Request
```http
POST /api/projects
Content-Type: application/json

{
  "name": "My New Project",
  "identifier": "my-new-project",
  "description": "Project description",
  "startDate": "2026-01-15",
  "endDate": "2026-06-30"
}
```

### Validation Rules (từ validations.ts)
```typescript
createProjectSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    identifier: z.string().min(1).max(50)
        .regex(/^[a-z0-9-]+$/, 'chỉ chữ thường, số và dấu gạch ngang'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});
```

### Success Response (201)
```json
{
  "id": "project-uuid",
  "name": "My New Project",
  "identifier": "my-new-project",
  "description": "...",
  "creator": {"id": "...", "name": "..."},
  "members": [
    {
      "user": {"id": "...", "name": "..."},
      "role": {"id": "...", "name": "Manager"}
    }
  ],
  "_count": {"tasks": 0, "members": 1}
}
```

---

## 6. Side Effects

| Action | Description |
|--------|-------------|
| Creator as Manager | Auto-add creator to ProjectMember with Manager role |
| Enable Trackers | Enable ALL system trackers for the new project |
| Audit Log | logCreate('project', ...) |

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
