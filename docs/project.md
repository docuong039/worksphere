# Worksphere Project Documentation

## 1. Project Overview

**Worksphere** is a comprehensive Project Management and Issue Tracking system built with modern web technologies. It is designed to help teams organize, track, and manage their work efficiently. The system supports complex workflows, role-based access control (RBAC), time tracking, and detailed reporting.

Key capabilities include:
- **Multi-Project Management**: Support for hierarchical projects and portfolios.
- **Flexible Task Tracking**: Custom trackers (Bug, Feature, Support, etc.) with configurable workflows.
- **Powerful RBAC**: Granular permission system based on roles within projects.
- **Time Tracking**: Log time against tasks and activities.
- **Reporting**: Generate reports on task progress, time spent, and project health.
- **Notifications**: Real-time updates for assignment changes, comments, and status updates.

## 2. Technology Stack

### Core Framework
- **Frontend/Backend**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js

### Database & Storage
- **ORM**: Prisma
- **Database**: MySQL
- **Schema Management**: Prisma Migrate

### UI & Styling
- **Styling Engine**: Tailwind CSS v4
- **Component Library**: Radix UI (Headless primitives)
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit

### Authentication & Security
- **Auth Provider**: NextAuth.js v5 (beta)
- **Encryption**: bcryptjs
- **Validation**: Zod

### Utilities
- **Date Handling**: date-fns
- **PDF Generation**: jspdf, pdfmake

## 3. Directory Structure

```
worksphere/
├── src/
│   ├── app/                 # Next.js App Router root
│   │   ├── (dashboard)/     # Protected app routes (with sidebar layout)
│   │   ├── api/             # API Endpoints
│   │   └── login/           # Public login page
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI atoms (Button, Input, etc.)
│   │   ├── projects/        # Project-specific components
│   │   ├── tasks/           # Task-specific components
│   │   └── ...
│   ├── lib/                 # Core logic and utilities
│   │   ├── auth.ts          # Authentication configuration
│   │   ├── permissions.ts   # RBAC logic engine
│   │   ├── prisma.ts        # Database client instance
│   │   └── validations.ts   # Zod schemas
│   └── styles/              # Global styles
├── prisma/                  # Database schema and seed scripts
└── public/                  # Static assets
```

## 4. Functionality & Modules

### 4.1. Authentication & Authorization (RBAC)
The system uses a robust Role-Based Access Control model:
- **Users**: Can be regular users or **Administrators**. Administrators have full access to the system.
- **Projects**: Users are added to projects as **Members**.
- **Roles**: Each member has a `Role` (e.g., Manager, Developer, Reporter) within a project.
- **Permissions**: Roles are composed of granular `Permissions` (e.g., `tasks.create`, `time_logs.view`).
- **Role-Trackers**: Controls which roles can create tasks of specific types (Trackers).

### 4.2. Workflows & State Machine
Tasks follow a lifecycle defined by **Workflows**:
- **Tracker**: Defines the type of work (e.g., Bug, Feature).
- **Status**: The current state (e.g., New, In Progress, Closed).
- **Workflow Transitions**: Defines allowed state changes (e.g., New -> In Progress).
- **Transition Permissions**: Transitions can be restricted by Role (e.g., only Managers can move to "Closed").

### 4.3. Project Management
- **Hierarchy**: Projects can have parent/child relationships.
- **Settings**: Per-project settings for enabled Trackers and Members.
- **Versions**: Milestones for grouping tasks (e.g., "Sprint 1", "Release 1.0").

### 4.4. Task Management
- **Task Hierarchy**: Tasks can have subtasks (unlimited depth).
- **Attributes**: Priority, Due Date, Start Date, % Done, Estimated Hours.
- **Relations**: Tasks can relate to others (Blocks, Duplicates, Relates To, etc.).
- **Watchers**: Users can "watch" tasks to receive notifications.
- **Attachements**: File uploads for tasks.

### 4.5. Time Tracking
- **Time Logs**: Users log hours spent on a task or project.
- **Activities**: Time is categorized by activity (e.g., Development, Design).
- **Validation**: Logs are tied to projects and optionally tasks.

### 4.6. Saved Queries
- Users can save complex filter configurations as "Queries".
- Queries can be private or shared publicly with other project members.

## 5. Database Schema Overview

The database is normalized and relational. Key tables:

- **`users`**: System users.
- **`projects`**: Core container for all work.
- **`tasks`**: The central entity. Links to statuses, trackers, priorities, and users.
- **`roles` / `permissions`**: Store the RBAC configuration.
- **`workflow_transitions`**: Stores the allowed status changes matrix.
- **`time_logs`**: Stores spent time entries.
- **`versions`**: Project milestones.

## 6. Key API Routes

### Projects
- `GET /api/projects`: List projects.
- `POST /api/projects`: Create project.
- `GET /api/projects/[id]`: Get details.
- `GET /api/projects/[id]/statistics`: Dashboard stats.

### Tasks
- `GET /api/tasks`: Global task search/list.
- `POST /api/tasks`: Create task.
- `PATCH /api/tasks/[id]`: Update task.
- `POST /api/tasks/[id]/time-logs`: Log time.

### Configuration
- `GET /api/trackers`: List available trackers.
- `GET /api/statuses`: List available statuses.
- `GET /api/workflow/transitions`: Check allowed transitions.

### Users & Roles
- `GET /api/users`: User management.
- `GET /api/roles`: Role customization.
- `GET /api/permissions`: List all system permissions.
