# Sequence Diagram 14: Check Permission (Common Pattern)

> **Use Case**: Common - Được gọi từ nhiều UC  
> **Module**: RBAC System  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Caller (any service/API), Permission Service, Database |
| **Trigger** | Any protected operation |
| **Purpose** | Centralized RBAC check for all operations |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Check Permission (Common Pattern)

participant "Caller\n(API/Service)" as Caller #LightBlue
participant "Permission\nService" as PermService #Pink
database "Database\n(Prisma)" as DB #LightGray

== hasPermission(userId, projectId, permissionKey) ==

Caller -> PermService: hasPermission(userId, projectId, "tasks.create")

== Check Administrator ==
PermService -> DB: SELECT isAdministrator FROM User\nWHERE id = ?
DB --> PermService: user

alt user.isAdministrator = true
    PermService --> Caller: true
    note right of PermService
        Administrator bypasses
        all permission checks
    end note
end

== Get User's Role in Project ==
PermService -> DB: SELECT roleId FROM ProjectMember\nWHERE userId = ? AND projectId = ?
DB --> PermService: projectMember | null

alt Not a member
    PermService --> Caller: false
    note right of PermService
        User must be member
        of the project
    end note
end

== Get Role's Permissions ==
PermService -> DB: SELECT p.key FROM Permission p\nJOIN RolePermission rp ON p.id = rp.permissionId\nWHERE rp.roleId = ?
DB --> PermService: permissions[]

== Check Permission ==
PermService -> PermService: Check if permissionKey in permissions

alt Permission found
    PermService --> Caller: true
else Permission not found
    PermService --> Caller: false
end

== Alternative: isCreatorOrAdmin ==

Caller -> PermService: isCreatorOrAdmin(userId, entity)

PermService -> PermService: Check userId === entity.creatorId
alt Is creator
    PermService --> Caller: true
else
    PermService -> DB: SELECT isAdministrator FROM User
    DB --> PermService: user
    alt isAdministrator
        PermService --> Caller: true
    else
        PermService --> Caller: false
    end
end

== Alternative: canEditTask ==

Caller -> PermService: canEditTask(userId, task)

PermService -> PermService: hasPermission(userId, projectId, "tasks.edit_any")
alt Has edit_any
    PermService --> Caller: true
else
    PermService -> PermService: hasPermission(userId, projectId, "tasks.edit_own")
    alt Has edit_own AND is creator
        PermService --> Caller: task.creatorId === userId
    else
        PermService --> Caller: false
    end
end

@enduml
```

---

## 3. Permission Check Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `hasPermission` | userId, projectId, key | Check specific permission in project |
| `isCreatorOrAdmin` | userId, entity | Check if creator or admin |
| `canEditTask` | userId, task | Check task edit permission |
| `canViewTask` | userId, task | Check task view (including private) |
| `getAccessibleProjects` | userId | Get all accessible projectIds |

---

## 4. Permission Keys

```typescript
const PERMISSION_KEYS = {
  // Projects
  'projects.create': 'Tạo dự án',
  'projects.manage_members': 'Quản lý thành viên',
  'projects.manage_versions': 'Quản lý phiên bản',
  'projects.manage_trackers': 'Quản lý loại công việc',
  
  // Tasks
  'tasks.create': 'Tạo công việc',
  'tasks.edit_own': 'Sửa công việc của mình',
  'tasks.edit_any': 'Sửa mọi công việc',
  'tasks.delete': 'Xóa công việc',
  'tasks.move': 'Di chuyển công việc',
  
  // Time/Workload
  'timelogs.view_own': 'Xem workload cá nhân',
  'timelogs.view_all': 'Xem workload tất cả',
  
  // Queries
  'queries.manage_public': 'Tạo bộ lọc công khai',
};
```

---

## 5. Implementation (lib/permissions.ts)

```typescript
export async function hasPermission(
  userId: string,
  projectId: string | null,
  permissionKey: string
): Promise<boolean> {
  // 1. Check admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdministrator: true }
  });
  
  if (user?.isAdministrator) return true;
  
  // 2. Check membership
  if (!projectId) return false;
  
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });
  
  if (!member) return false;
  
  // 3. Check permission
  return member.role.permissions.some(
    rp => rp.permission.key === permissionKey
  );
}
```

---

## 6. Usage in API Routes

```typescript
// Example: Create Task API
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  const { projectId, ...taskData } = await req.json();
  
  // Permission check
  const canCreate = await hasPermission(
    session.user.id,
    projectId,
    'tasks.create'
  );
  
  if (!canCreate) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Proceed with task creation...
}
```

---

## 7. RBAC Database Schema

```
┌─────────┐     ┌───────────────┐     ┌────────────┐
│  User   │────<│ ProjectMember │>────│   Role     │
└─────────┘     └───────────────┘     └────────────┘
     │                                       │
     │                                       │
     │               ┌────────────────┐      │
     │               │ RolePermission │──────┘
     │               └────────────────┘
     │                       │
     │               ┌───────────────┐
     └───────────────│  Permission   │
                     └───────────────┘
```

---

*Ngày tạo: 2026-01-15*
