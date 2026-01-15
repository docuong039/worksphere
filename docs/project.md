# Worksphere - Tài liệu Dự án Toàn diện

> **Mục đích:** Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về toàn bộ dự án Worksphere, giúp bất kỳ AI agent hoặc developer nào cũng có thể hiểu và làm việc với dự án mà không cần đọc lại toàn bộ mã nguồn.

---

## 📋 Tổng quan Dự án

**Worksphere** là một hệ thống quản lý dự án và công việc (Project & Task Management System) chuyên nghiệp, lấy cảm hứng từ Redmine. Hệ thống hỗ trợ:

- Quản lý dự án với phân cấp (project hierarchy)
- Quản lý công việc (tasks/issues) với workflow linh hoạt
- Phân quyền chi tiết theo vai trò (RBAC - Role-Based Access Control)
- Theo dõi thời gian (Time Tracking)
- Báo cáo và xuất dữ liệu
- Thông báo và audit log

---

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Database** | MySQL |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js v5 (Beta) |
| **UI Components** | Radix UI, Lucide Icons |
| **Validation** | Zod |
| **PDF Export** | jsPDF, pdfmake |
| **Drag & Drop** | @dnd-kit |

---

## 📁 Cấu trúc Thư mục

```
worksphere/
├── prisma/                     # Database schema và seed data
│   ├── schema.prisma          # Prisma schema định nghĩa database
│   └── seed.ts                # Script khởi tạo dữ liệu mẫu
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (dashboard)/       # Protected routes (cần đăng nhập)
│   │   ├── api/               # API Routes
│   │   ├── login/             # Trang đăng nhập
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page (redirect)
│   ├── components/            # React components
│   │   ├── layout/            # Layout components (Sidebar, Header)
│   │   ├── projects/          # Project-related components
│   │   ├── tasks/             # Task-related components
│   │   ├── ui/                # Reusable UI components
│   │   └── ...                # Other feature components
│   ├── config/                # Configuration files
│   ├── lib/                   # Shared utilities và services
│   │   ├── services/          # Business logic services
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client instance
│   │   ├── permissions.ts     # Permission checking utilities
│   │   ├── validations.ts     # Zod schemas
│   │   ├── notifications.ts   # Notification service
│   │   ├── audit-log.ts       # Audit logging service
│   │   └── ...
│   ├── styles/                # Additional styles
│   └── types/                 # TypeScript type definitions
├── docs/                       # Documentation
├── .env                        # Environment variables
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## 🗄 Database Schema (Prisma)

### 1. User Management

#### `User`
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String
  password        String
  avatar          String?
  isAdministrator Boolean  @default(false)  // Quyền admin hệ thống
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Quan hệ:**
- `projectMemberships`: Danh sách dự án tham gia
- `createdProjects`: Dự án đã tạo
- `assignedTasks`: Công việc được gán
- `createdTasks`: Công việc đã tạo
- `watchedTasks`: Công việc đang theo dõi
- `comments`: Bình luận
- `notifications`: Thông báo
- `auditLogs`: Nhật ký hoạt động

---

### 2. RBAC (Role-Based Access Control)

#### `Role`
```prisma
model Role {
  id               String  @id @default(cuid())
  name             String  @unique
  description      String?
  isActive         Boolean @default(true)
  assignable       Boolean @default(true)   // Có thể được gán task?
  canAssignToOther Boolean @default(true)   // Có thể gán task cho người khác?
}
```

**Các vai trò mặc định:**
| Vai trò | Mô tả | assignable | canAssignToOther |
|---------|-------|------------|------------------|
| Manager | Quản lý dự án | ✅ | ✅ |
| Tech Lead | Trưởng nhóm kỹ thuật | ✅ | ✅ |
| Developer | Lập trình viên | ✅ | ❌ |
| Tester | Kiểm thử viên | ✅ | ❌ |
| Designer | Thiết kế viên | ✅ | ❌ |
| Reporter | Người báo cáo | ❌ | ❌ |
| Viewer | Chỉ xem | ❌ | ❌ |

#### `Permission`
```prisma
model Permission {
  id          String @id @default(cuid())
  key         String @unique  // e.g., "tasks.create"
  name        String
  description String?
  module      String          // e.g., "tasks", "projects"
}
```

**Các permission modules:**
- `users`: Quản lý người dùng
- `projects`: Quản lý dự án
- `tasks`: Quản lý công việc
- `reports`: Báo cáo
- `system`: Cài đặt hệ thống

#### `RolePermission`
Bảng liên kết Role-Permission (Many-to-Many)

#### `RoleTracker`
Bảng xác định Role nào có thể sử dụng Tracker nào

---

### 3. Task Configuration

#### `Tracker`
Loại công việc (Bug, Feature, Task, Support):
```prisma
model Tracker {
  id          String  @id @default(cuid())
  name        String  @unique  // "Bug", "Feature", "Task", "Support"
  description String?
  position    Int     @default(0)
  isDefault   Boolean @default(false)
}
```

#### `Status`
Trạng thái công việc:
```prisma
model Status {
  id               String  @id @default(cuid())
  name             String  @unique  // "New", "In Progress", "Resolved", "Closed", "Rejected"
  position         Int     @default(0)
  isClosed         Boolean @default(false)  // Trạng thái đóng
  isDefault        Boolean @default(false)
  defaultDoneRatio Int?    // Tự động set done ratio khi chuyển sang status này
}
```

#### `Priority`
Mức độ ưu tiên:
```prisma
model Priority {
  id        String  @id @default(cuid())
  name      String  @unique  // "Low", "Normal", "High", "Urgent", "Immediate"
  position  Int     @default(0)
  color     String?          // Mã màu hex
  isDefault Boolean @default(false)
}
```

#### `WorkflowTransition`
Định nghĩa chuyển đổi trạng thái được phép:
```prisma
model WorkflowTransition {
  id           String  @id @default(cuid())
  trackerId    String
  roleId       String?  // null = áp dụng cho tất cả roles
  fromStatusId String
  toStatusId   String
}
```

---

### 4. Project Management

#### `Project`
```prisma
model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  identifier  String    @unique  // URL-friendly identifier
  startDate   DateTime?
  endDate     DateTime?
  isArchived  Boolean   @default(false)
  isPublic    Boolean   @default(false)
  creatorId   String
  parentId    String?   // Hỗ trợ project hierarchy
  
  // Issue Tracking Settings (per-project)
  parentIssueDates          String @default("calculated")
  parentIssuePriority       String @default("calculated")
  parentIssueDoneRatio      String @default("calculated")
  parentIssueEstimatedHours String @default("calculated")
}
```

#### `ProjectMember`
```prisma
model ProjectMember {
  id        String @id @default(cuid())
  projectId String
  userId    String
  roleId    String  // Vai trò trong dự án
}
```

#### `Version` (Milestone)
```prisma
model Version {
  id          String    @id @default(cuid())
  name        String
  description String?
  status      String    @default("open")  // open, locked, closed
  dueDate     DateTime?
  projectId   String
}
```

#### `IssueCategory`
Danh mục công việc theo dự án:
```prisma
model IssueCategory {
  id           String  @id @default(cuid())
  name         String
  projectId    String
  assignedToId String?  // Default assignee
}
```

---

### 5. Task Management

#### `Task`
```prisma
model Task {
  id             String    @id @default(cuid())
  number         Int       @unique @default(autoincrement())
  title          String
  description    String?
  trackerId      String
  statusId       String
  priorityId     String
  projectId      String
  assigneeId     String?
  creatorId      String
  parentId       String?   // Subtask support
  versionId      String?
  categoryId     String?
  path           String?   // Hierarchy path
  level          Int       @default(0)
  estimatedHours Float?
  doneRatio      Int       @default(0)  // 0-100%
  startDate      DateTime?
  dueDate        DateTime?
  isPrivate      Boolean   @default(false)
  lockVersion    Int       @default(0)  // Optimistic locking
}
```

#### `IssueRelation`
Quan hệ giữa các task:
```prisma
model IssueRelation {
  id           String @id @default(cuid())
  issueFromId  String
  issueToId    String
  relationType String  // relates, duplicates, blocks, precedes, follows...
  delay        Int?    // Delay in days (for precedes/follows)
}
```

**Các loại relation:**
- `relates`: Liên quan
- `duplicates` / `duplicated`: Trùng lặp
- `blocks` / `blocked`: Chặn
- `precedes` / `follows`: Trước/Sau
- `copied_to` / `copied_from`: Sao chép

#### `Watcher`
Người theo dõi task:
```prisma
model Watcher {
  taskId String
  userId String
}
```

#### `Comment`
Bình luận trên task:
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  taskId    String
  userId    String
  createdAt DateTime @default(now())
}
```

#### `Attachment`
File đính kèm:
```prisma
model Attachment {
  id       String @id @default(cuid())
  filename String
  path     String
  size     Int
  mimeType String
  taskId   String
  userId   String
}
```

---

### 6. Notifications & Audit

#### `Notification`
```prisma
model Notification {
  id        String   @id @default(cuid())
  type      String   // task_assigned, task_updated, task_status_changed, ...
  title     String
  message   String
  isRead    Boolean  @default(false)
  userId    String
  metadata  Json?
}
```

#### `AuditLog`
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // created, updated, deleted, archived
  entityType String   // user, project, task, ...
  entityId   String
  changes    Json?    // { old: {...}, new: {...} }
  userId     String
  createdAt  DateTime @default(now())
}
```

---

### 7. Saved Queries

#### `Query`
```prisma
model Query {
  id        String  @id @default(cuid())
  name      String
  projectId String?  // null = global query
  userId    String
  isPublic  Boolean @default(false)
  filters   String  // JSON array of filter conditions
  columns   String? // JSON array of column names
  sortBy    String?
  sortOrder String? @default("asc")
  groupBy   String?
}
```

---

## 🔐 Hệ thống Phân quyền (RBAC)

### Luồng kiểm tra quyền

```
User Request
    ↓
Session Check (auth.ts)
    ↓
isAdministrator? → YES → Full Access
    ↓ NO
Get User's Role in Project (ProjectMember)
    ↓
Check RolePermission
    ↓
Permission Granted/Denied
```

### File: `src/lib/permissions.ts`

**Các hàm chính:**

| Hàm | Mô tả |
|-----|-------|
| `hasPermission(user, permissionKey, projectId?)` | Kiểm tra user có permission cụ thể |
| `hasAnyPermission(user, permissionKeys[], projectId?)` | Kiểm tra có bất kỳ permission nào |
| `hasAllPermissions(user, permissionKeys[], projectId?)` | Kiểm tra có tất cả permissions |
| `getUserPermissions(userId, projectId?)` | Lấy danh sách permissions của user |
| `isProjectMember(userId, projectId)` | Kiểm tra có phải member của project |
| `canViewTask(user, taskId)` | Kiểm tra có thể xem task |
| `canEditTask(user, taskId)` | Kiểm tra có thể sửa task |
| `canTransitionStatus(user, taskId, toStatusId)` | Kiểm tra có thể chuyển status |
| `getAccessibleProjectIds(userId, permissionKey)` | Lấy danh sách project IDs có quyền |
| `checkProjectPermission(user, permissionKey, projectId)` | Wrapper cho controller |

### Danh sách Permissions

**Module: users**
- `users.view_all` - Xem tất cả users
- `users.create` - Tạo user
- `users.edit_any` - Sửa bất kỳ user
- `users.delete` - Xóa user
- `users.set_administrator` - Đặt quyền admin

**Module: projects**
- `projects.view_all` - Xem tất cả projects
- `projects.view_joined` - Xem projects đã tham gia
- `projects.create` - Tạo project
- `projects.edit_own` - Sửa project của mình
- `projects.edit_any` - Sửa bất kỳ project
- `projects.delete_any` - Xóa bất kỳ project
- `projects.manage_members` - Quản lý thành viên
- `projects.archive` - Lưu trữ project

**Module: tasks**
- `tasks.view_all` - Xem tất cả tasks
- `tasks.view_project` - Xem tasks trong project
- `tasks.view_assigned` - Xem tasks được gán
- `tasks.create` - Tạo task
- `tasks.edit_own` - Sửa task của mình
- `tasks.edit_assigned` - Sửa task được gán
- `tasks.edit_any` - Sửa bất kỳ task
- `tasks.delete_any` - Xóa bất kỳ task
- `tasks.assign` - Gán task
- `tasks.change_status` - Thay đổi status
- `tasks.comment` - Bình luận
- `tasks.upload_files` - Upload file

**Module: reports**
- `reports.view_personal` - Xem báo cáo cá nhân
- `reports.view_project` - Xem báo cáo project
- `reports.view_system` - Xem báo cáo hệ thống
- `reports.export` - Xuất báo cáo

**Module: system**
- `system.manage_roles` - Quản lý vai trò
- `system.manage_config` - Quản lý cấu hình
- `system.settings` - Cài đặt hệ thống
- `system.audit_logs` - Xem audit logs

---

## 🔄 Workflow System

### Cấu trúc Workflow

Workflow định nghĩa các chuyển đổi trạng thái được phép, dựa trên:
- **Tracker**: Loại công việc (Bug, Feature, Task, Support)
- **Role**: Vai trò của người thực hiện (nullable = áp dụng cho tất cả)
- **From Status → To Status**: Chuyển từ trạng thái nào sang trạng thái nào

### Luồng kiểm tra Workflow

```
User muốn chuyển status
    ↓
Lấy task hiện tại (trackerId, statusId)
    ↓
Lấy role của user trong project
    ↓
Tìm WorkflowTransition:
  - trackerId = task.trackerId
  - fromStatusId = task.statusId
  - toStatusId = newStatusId
  - roleId = user.roleId OR null
    ↓
Transition exists? → YES → Allow
    ↓ NO
Deny
```

### API Workflow

**GET `/api/workflow`**
- Params: `trackerId`, `roleId`
- Returns: trackers, statuses, roles, transitions

**POST `/api/workflow`**
- Body: `{ trackerId, roleId, transitions: [] }`
- Chỉ Admin mới có quyền

---

## 📡 API Routes

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST | `/api/auth/*` | NextAuth handlers |

### Projects

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/projects` | Danh sách projects |
| POST | `/api/projects` | Tạo project mới |
| GET | `/api/projects/[id]` | Chi tiết project |
| PUT | `/api/projects/[id]` | Cập nhật project |
| DELETE | `/api/projects/[id]` | Xóa project |
| POST | `/api/projects/[id]/archive` | Archive/Unarchive |
| GET | `/api/projects/[id]/members` | Danh sách members |
| POST | `/api/projects/[id]/members` | Thêm member |
| DELETE | `/api/projects/[id]/members/[memberId]` | Xóa member |
| GET | `/api/projects/[id]/trackers` | Trackers của project |
| PUT | `/api/projects/[id]/trackers` | Cập nhật trackers |
| GET | `/api/projects/[id]/versions` | Danh sách versions |
| GET | `/api/projects/[id]/categories` | Danh sách categories |
| GET | `/api/projects/[id]/roadmap` | Roadmap view |
| GET | `/api/projects/[id]/subprojects` | Danh sách subprojects |
| GET/PUT | `/api/projects/[id]/issue-settings` | Cài đặt issue tracking |

### Tasks

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/tasks` | Danh sách tasks (với filters) |
| POST | `/api/tasks` | Tạo task mới |
| GET | `/api/tasks/[id]` | Chi tiết task |
| PUT | `/api/tasks/[id]` | Cập nhật task |
| DELETE | `/api/tasks/[id]` | Xóa task |
| POST | `/api/tasks/[id]/copy` | Copy task |
| POST | `/api/tasks/[id]/move` | Move task sang project khác |
| POST | `/api/tasks/[id]/duplicate` | Duplicate task |
| GET | `/api/tasks/[id]/comments` | Danh sách comments |
| POST | `/api/tasks/[id]/comments` | Thêm comment |
| GET | `/api/tasks/[id]/attachments` | Danh sách attachments |
| POST | `/api/tasks/[id]/attachments` | Upload attachment |
| GET | `/api/tasks/[id]/watchers` | Danh sách watchers |
| POST | `/api/tasks/[id]/watchers` | Thêm watcher |
| DELETE | `/api/tasks/[id]/watchers/[userId]` | Xóa watcher |
| POST | `/api/tasks/[id]/watch` | Toggle watch (self) |
| GET | `/api/tasks/[id]/relations` | Danh sách relations |
| POST | `/api/tasks/[id]/relations` | Thêm relation |
| GET | `/api/tasks/[id]/time-logs` | Time logs |
| POST | `/api/tasks/[id]/time-logs` | Log time |
| POST | `/api/tasks/bulk-update` | Bulk update tasks |

### Configuration

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST | `/api/trackers` | Quản lý trackers |
| GET/PUT/DELETE | `/api/trackers/[id]` | Chi tiết tracker |
| GET/POST | `/api/statuses` | Quản lý statuses |
| GET/PUT/DELETE | `/api/statuses/[id]` | Chi tiết status |
| GET/POST | `/api/priorities` | Quản lý priorities |
| GET/PUT/DELETE | `/api/priorities/[id]` | Chi tiết priority |
| GET/POST | `/api/roles` | Quản lý roles |
| GET/PUT/DELETE | `/api/roles/[id]` | Chi tiết role |
| GET/PUT | `/api/roles/[id]/permissions` | Permissions của role |
| GET/PUT | `/api/roles/[id]/trackers` | Trackers của role |
| GET/POST | `/api/workflow` | Quản lý workflow |
| GET/POST | `/api/users` | Quản lý users |
| GET/PUT | `/api/users/[id]` | Chi tiết user |

### Others

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/search` | Global search |
| GET | `/api/activity` | Activity feed |
| GET | `/api/notifications` | Danh sách notifications |
| POST | `/api/notifications/read` | Mark as read |
| GET | `/api/reports/tasks` | Task reports |
| GET | `/api/reports/time` | Time reports |
| GET/POST | `/api/queries` | Saved queries |
| GET/PUT/DELETE | `/api/queries/[id]` | Chi tiết query |
| GET | `/api/dashboard` | Dashboard data |
| GET/PUT | `/api/settings` | System settings |
| GET | `/api/permissions` | All permissions |
| POST | `/api/versions` | Tạo version |
| PUT/DELETE | `/api/versions/[id]` | Quản lý version |
| DELETE | `/api/attachments/[id]` | Xóa attachment |
| DELETE | `/api/relations/[id]` | Xóa relation |
| DELETE | `/api/categories/[id]` | Xóa category |

---

## 🖥 Pages (Frontend Routes)

### Public Routes

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/login` | `LoginPage` | Trang đăng nhập |

### Dashboard Routes (`(dashboard)` group)

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/dashboard` | `DashboardPage` | Trang chính sau đăng nhập |
| `/projects` | `ProjectsPage` | Danh sách dự án |
| `/projects/[id]` | `ProjectDetailPage` | Chi tiết dự án |
| `/projects/[id]/tasks` | `ProjectTasksPage` | Tasks của dự án |
| `/projects/[id]/members` | `ProjectMembersPage` | Thành viên dự án |
| `/projects/[id]/versions` | `ProjectVersionsPage` | Versions/Milestones |
| `/projects/[id]/roadmap` | `RoadmapPage` | Roadmap view |
| `/projects/[id]/settings` | `ProjectSettingsPage` | Cài đặt dự án |
| `/projects/[id]/activity` | `ProjectActivityPage` | Hoạt động dự án |
| `/projects/[id]/categories` | `CategoriesPage` | Danh mục |
| `/tasks` | `TasksPage` | Danh sách tất cả tasks |
| `/tasks/[id]` | `TaskDetailPage` | Chi tiết task |
| `/time-logs` | `TimeLogsPage` | Theo dõi thời gian |
| `/activity` | `ActivityPage` | Hoạt động gần đây |
| `/reports` | `ReportsPage` | Báo cáo |
| `/reports/export` | `ExportPage` | Xuất dữ liệu |

### Settings Routes (Admin only)

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/settings/trackers` | `TrackersPage` | Quản lý trackers |
| `/settings/statuses` | `StatusesPage` | Quản lý statuses |
| `/settings/priorities` | `PrioritiesPage` | Quản lý priorities |
| `/settings/workflow` | `WorkflowPage` | Quản lý workflow |
| `/settings/roles` | `RolesPage` | Quản lý vai trò |
| `/settings/users` | `UsersPage` | Quản lý người dùng |
| `/settings/issue-tracking` | `IssueTrackingPage` | Cài đặt Issue Tracking |

---

## 🧩 Components chính

### Layout Components (`src/components/layout/`)

| Component | File | Mô tả |
|-----------|------|-------|
| `Sidebar` | `sidebar.tsx` | Sidebar navigation với menu chính và admin menu |
| `Header` | `header.tsx` | Header với user info |
| `GlobalSearch` | `global-search.tsx` | Command palette (Ctrl+K) tìm kiếm toàn cục |
| `NotificationBell` | `notification-bell.tsx` | Icon thông báo với dropdown |

### Project Components (`src/components/projects/`)

| Component | File | Mô tả |
|-----------|------|-------|
| `ProjectList` | `project-list.tsx` | Danh sách projects với search/filter |
| `ProjectOverview` | `project-overview.tsx` | Tổng quan project |
| `ProjectMembers` | `project-members.tsx` | Quản lý thành viên |
| `ProjectSettingsClient` | `project-settings-client.tsx` | Cài đặt project |
| `ProjectTabs` | `project-tabs.tsx` | Tab navigation trong project |
| `ProjectTrackerSettings` | `project-tracker-settings.tsx` | Cài đặt trackers cho project |
| `ProjectIssueSettings` | `project-issue-settings.tsx` | Cài đặt issue tracking |
| `VersionsManager` | `versions-manager.tsx` | Quản lý versions/milestones |
| `RoadmapView` | `roadmap-view.tsx` | Hiển thị roadmap |

### Task Components (`src/components/tasks/`)

| Component | File | Mô tả |
|-----------|------|-------|
| `TaskList` | `task-list.tsx` | Danh sách tasks với filters, sorting, grouping |
| `TaskDetail` | `task-detail.tsx` | Chi tiết task với edit form |
| `TaskCard` | `task-card.tsx` | Card hiển thị task trong list/kanban |
| `CreateTaskModal` | `create-task-modal.tsx` | Modal tạo task mới |
| `KanbanBoard` | `kanban-board.tsx` | Kanban view với drag-drop |
| `TaskContextMenu` | `task-context-menu.tsx` | Right-click menu cho task |
| `TaskAttachments` | `task-attachments.tsx` | Quản lý file đính kèm |
| `TaskWatchers` | `task-watchers.tsx` | Quản lý watchers |
| `TaskRelations` | `task-relations.tsx` | Quản lý relations |
| `SavedQueries` | `saved-queries.tsx` | Lưu/Load queries |
| `BulkEditModal` | `bulk-edit-modal.tsx` | Bulk edit tasks |
| `CopyMoveTaskModal` | `copy-move-task-modal.tsx` | Copy/Move task |
| `VersionSelector` | `version-selector.tsx` | Dropdown chọn version |
| `DoneRatioSlider` | `done-ratio-slider.tsx` | Slider % hoàn thành |

### UI Components (`src/components/ui/`)

Các UI components dựa trên Radix UI:
- `Button`, `Input`, `Textarea`, `Label`
- `Select`, `Switch`, `Tabs`
- `Dialog`, `Popover`, `DropdownMenu`
- `Card`, `Separator`, `ScrollArea`
- `Avatar`, `Command`, `Toaster`

---

## 📦 Lib / Services

### `src/lib/auth.ts`
NextAuth configuration với Credentials provider:
- Email/Password authentication
- JWT session strategy
- Lưu `id`, `isAdministrator` vào session

### `src/lib/prisma.ts`
Singleton Prisma Client instance

### `src/lib/permissions.ts`
Permission checking utilities (đã mô tả ở trên)

### `src/lib/validations.ts`
Zod schemas cho validation:
- `createTrackerSchema`, `updateTrackerSchema`
- `createStatusSchema`, `updateStatusSchema`
- `createPrioritySchema`, `updatePrioritySchema`
- `createRoleSchema`, `updateRoleSchema`
- `createUserSchema`, `updateUserSchema`
- `createProjectSchema`, `updateProjectSchema`
- `createVersionSchema`, `updateVersionSchema`
- `createTaskSchema`, `updateTaskSchema`
- `createIssueRelationSchema`
- `createCommentSchema`, `updateCommentSchema`
- `updateWorkflowSchema`
- `addWatcherSchema`, `removeWatcherSchema`

### `src/lib/notifications.ts`
Notification service:
- `createNotification(data)` - Tạo thông báo
- `createNotifications(notifications[])` - Tạo nhiều thông báo
- `notifyTaskWatchers(taskId, actorId, type, title, message)` - Thông báo watchers
- `notifyTaskAssigned(taskId, taskTitle, assigneeId, actorName)` - Thông báo gán task
- `notifyTaskStatusChanged(...)` - Thông báo đổi status
- `notifyCommentAdded(...)` - Thông báo comment mới

**Notification Types:**
- `task_assigned`
- `task_updated`
- `task_status_changed`
- `task_comment_added`
- `task_mentioned`
- `task_due_soon`
- `project_member_added`
- `project_member_removed`

### `src/lib/audit-log.ts`
Audit logging service:
- `createAuditLog(data)` - Tạo log
- `logCreate(entityType, entityId, userId, newData)` - Log tạo mới
- `logUpdate(entityType, entityId, userId, oldData, newData)` - Log cập nhật (auto diff)
- `logDelete(entityType, entityId, userId, oldData)` - Log xóa
- `getEntityAuditLogs(entityType, entityId)` - Lấy logs của entity
- `getUserAuditLogs(userId, limit)` - Lấy logs của user

**Entity Types:**
- `user`, `project`, `task`, `comment`
- `attachment`, `time_log`, `role`
- `tracker`, `status`, `priority`, `workflow`

### `src/lib/api-error.ts`
API error handling utilities:
- `successResponse(data, status)` - Response thành công
- `errorResponse(message, status)` - Response lỗi
- `handleApiError(error)` - Xử lý lỗi chung

### `src/lib/system-settings.ts`
System settings (stored as JSON file):
```typescript
interface SystemSettings {
  parent_issue_dates: 'calculated' | 'independent';
  parent_issue_priority: 'calculated' | 'independent';
  parent_issue_done_ratio: 'calculated' | 'independent';
  parent_issue_estimated_hours: 'calculated' | 'independent';
}
```

- `getSystemSettings()` - Đọc settings
- `updateSystemSettings(newSettings)` - Cập nhật settings

### `src/lib/services/task-service.ts`
Task business logic:
- `updateParentAttributes(parentId)` - Tự động cập nhật parent task dựa trên subtasks (dates, priority, doneRatio, estimatedHours)
- `updateSubtasksPathAndLevel(taskId, newPath, newLevel)` - Cập nhật path/level khi di chuyển task

---

## 🔄 Luồng xử lý chính

### 1. Tạo Task mới

```
POST /api/tasks
    ↓
Validate session
    ↓
Check permission: tasks.create + project member
    ↓
Check workflow: có transition từ null → defaultStatus?
    ↓
Check tracker allowed cho role trong project
    ↓
Validate input với createTaskSchema
    ↓
Tạo task trong DB
    ↓
Nếu có parentId: updateParentAttributes(parentId)
    ↓
Tạo audit log
    ↓
Return task
```

### 2. Cập nhật Task

```
PUT /api/tasks/[id]
    ↓
Validate session
    ↓
Check canEditTask (permission + ownership)
    ↓
Nếu đổi status: Check workflow transition
    ↓
Validate input với updateTaskSchema
    ↓
Check optimistic locking (lockVersion)
    ↓
Update task
    ↓
Nếu có oldParentId hoặc newParentId:
  updateParentAttributes(cả 2)
    ↓
Tạo audit log
    ↓
Gửi notifications (status change, assignment)
    ↓
Return updated task
```

### 3. Xem danh sách Tasks

```
GET /api/tasks
    ↓
Validate session
    ↓
Xác định projectIds user có quyền xem
    ↓
Parse filters từ query params
    ↓
Build Prisma where clause
    ↓
Fetch tasks + relations
    ↓
Return tasks
```

### 4. Login

```
POST /api/auth/callback/credentials
    ↓
Tìm user theo email
    ↓
Verify password với bcrypt
    ↓
Check isActive
    ↓
Tạo JWT token với id, email, name, isAdministrator
    ↓
Set session cookie
    ↓
Redirect to /dashboard
```

---

## 🗃 Seed Data

File `prisma/seed.ts` tạo dữ liệu ban đầu:

1. **30 Permissions** (users, projects, tasks, reports, system)
2. **4 Trackers** (Bug, Feature, Task, Support)
3. **5 Statuses** (New, In Progress, Resolved, Closed, Rejected)
4. **5 Priorities** (Low, Normal, High, Urgent, Immediate)
5. **7 Roles** với permissions phù hợp
6. **1 Admin User**:
   - Email: `admin@worksphere.com`
   - Password: `admin123`

---

## 🚀 Chạy dự án

### Development

```bash
# Cài dependencies
npm install

# Setup database
npx prisma db push
npx prisma db seed

# Chạy dev server
npm run dev
```

### Production

```bash
npm run build
npm run start
```

### Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Development server |
| `npm run build` | Build production |
| `npm run start` | Start production |
| `npm run lint` | ESLint check |

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/worksphere"

# NextAuth
AUTH_SECRET="your_secret_key"
```

---

## 📝 Notes cho AI Agents

1. **Admin bypass**: User với `isAdministrator=true` bypass tất cả permission checks
2. **Project-scoped permissions**: Hầu hết permissions đều scope theo project
3. **Workflow là bắt buộc**: Không thể chuyển status nếu không có transition được định nghĩa
4. **Parent task auto-update**: Khi subtask thay đổi, parent tự động cập nhật (nếu setting = 'calculated')
5. **Optimistic locking**: Task có `lockVersion` để tránh concurrent updates
6. **Soft delete**: Projects dùng `isArchived` thay vì xóa thật
7. **Audit trail**: Mọi thay đổi được log vào `AuditLog`
8. **Notifications**: Tự động notify watchers, assignees khi có thay đổi

---

*Tài liệu được tạo tự động. Cập nhật lần cuối: 2026-01-14*
