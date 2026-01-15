# Worksphere - Tài liệu Dự án Toàn diện

> **Mục đích:** Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về toàn bộ dự án Worksphere, giúp bất kỳ AI agent hoặc developer nào cũng có thể hiểu và làm việc với dự án mà không cần đọc lại toàn bộ mã nguồn.

---

## 📋 Tổng quan Dự án

**Worksphere** là một hệ thống quản lý dự án và công việc (Project & Task Management System) chuyên nghiệp, lấy cảm hứng từ Redmine. Hệ thống hỗ trợ:

- Quản lý dự án với phân cấp (project hierarchy)
- Quản lý công việc (tasks/issues) với workflow linh hoạt
- Phân quyền chi tiết theo vai trò (RBAC - Role-Based Access Control)
- Quản lý phân bổ công việc (Workload Management)
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
│   │   ├── workload/          # Workload-related components
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
- `projectMemberships`, `createdProjects`
- `assignedTasks`, `createdTasks`
- `watchedTasks`, `comments`, `notifications`, `auditLogs`

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

#### `Permission` & `RolePermission`
Định nghĩa quyền và bảng liên kết Many-to-Many với Role.

---

### 3. Task Configuration

#### `Tracker`, `Status`, `Priority`, `WorkflowTransition`
Các bảng cấu hình dữ liệu nền cho task (Loại, Trạng thái, Ưu tiên, Quy trình).

---

### 4. Project Management

#### `Project`
```prisma
model Project {
  id          String    @id @default(cuid())
  name        String
  identifier  String    @unique
  // ...
  // Issue Tracking Settings (per-project customization)
  parentIssueDates          String @default("calculated")
  parentIssuePriority       String @default("calculated")
  parentIssueDoneRatio      String @default("calculated")
  parentIssueEstimatedHours String @default("calculated")
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
  // ...
  estimatedHours Float?    // Giờ dự kiến (dùng cho Workload)
  doneRatio      Int       @default(0)  // 0-100%
  // ...
}
```

**Models liên quan:** `Watcher`, `Comment`, `Attachment`, `IssueRelation`, `Version`

---

## 🔐 Hệ thống Phân quyền (RBAC)

### File: `src/lib/permissions.ts`

**Các Permissions chính:**

*   **Projects**: `projects.view_all`, `projects.create`, `projects.edit_any`, `projects.manage_members`...
*   **Tasks**: `tasks.view_all`, `tasks.create`, `tasks.edit_own`, `tasks.edit_any`...
*   **Workload (Time Logs)**:
    *   `timelogs.view_own`: Xem workload cá nhân.
    *   `timelogs.view_all`: Xem workload của người khác/toàn dự án.
*   **System**: `system.manage_roles`, `system.manage_config`...

---

## 📡 API Routes

### Projects
- `GET/POST /api/projects`: CRUD Project
- `GET /api/projects/[id]/issue-settings`: Cài đặt Issue Tracking

### Tasks
- `GET/POST /api/tasks`: CRUD Task
- `POST /api/tasks/[id]/copy`: Copy Task

### Workload (Phân bổ công việc)
- `GET /api/workload`: Lấy dữ liệu thống kê workload (theo `userId` hoặc `projectId`).

### Configuration (Admin)
- `/api/trackers`, `/api/statuses`, `/api/roles`, `/api/workflow`

---

## 🖥 Pages (Frontend Routes)

### Workspace
- `/dashboard`: Dashboard tổng quan
- `/projects`: Danh sách dự án
- `/tasks`: Danh sách công việc toàn cục
- `/workload`: (Trang này có thể truy cập qua `/reports` hoặc tab Workload trong project)
- `/reports`: Báo cáo & Workload

### Project Context
- `/projects/[id]`: Chi tiết dự án
- `/projects/[id]/tasks`: Danh sách task dự án
- `/projects/[id]/workload`: Phân bổ công việc dự án
- `/projects/[id]/settings`: Cài đặt dự án

### Admin Settings
- `/settings/trackers`, `/settings/statuses`, `/settings/roles`, `/settings/workflow`...

---

## 🧩 Components chính

### Layout (`src/components/layout/`)
- `Sidebar`, `Header`, `GlobalSearch`

### Workload (`src/components/workload/`)
- `WorkloadContent`: Component hiển thị bảng phân bổ thời gian (Summary & Detail).

### Tasks (`src/components/tasks/`)
- `TaskList`, `TaskDetail`, `KanbanBoard`, `TaskCard`

---

## 🔄 Luồng xử lý chính

### 1. Workload Calculation
- **Input**: Danh sách Task có `estimatedHours`.
- **Logic**: 
  - Group by `assigneeId`.
  - Nếu view project: Lấy list Project Member để hiện cả user 0h.
  - Nếu view global: Chỉ lấy user có task.
- **Output**: Bảng thống kê (User, Total Hours, Task Count).

### 2. Task Permission Check
- **View**: Kiểm tra `isPrivate`, `tasks.view_all`, `tasks.view_project` (member), `tasks.view_assigned`.
- **Edit**: Kiểm tra `tasks.edit_any`, `tasks.edit_assigned`, `tasks.edit_own`.

---

*Tài liệu này được cập nhật tự động để phản ánh trạng thái hiện tại của mã nguồn Worksphere.*
