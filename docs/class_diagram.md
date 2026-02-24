# Sơ đồ lớp chuẩn Schema dự án WorkSphere (Bản đầy đủ 100%)

File này mô tả toàn bộ cấu trúc lớp được ánh xạ trực tiếp 1-1 từ Prisma Schema của hệ thống.

## 1. Biểu đồ Mermaid
Bạn có thể xem trực quan bằng cách dán mã này vào [Mermaid Live Editor](https://mermaid.live/).

```mermaid
classDiagram
    %% ==========================================
    %% IDENTITY & ACCESS (RBAC)
    %% ==========================================
    class User {
        +String id
        +String email
        +String name
        +String avatar
        +Boolean isAdministrator
        +Boolean isActive
        +DateTime createdAt
    }

    class Role {
        +String id
        +String name
        +String description
        +Boolean assignable
        +Boolean canAssignToOther
    }

    class Permission {
        +String id
        +String key
        +String name
        +String module
    }

    class RolePermission {
        +String roleId
        +String permissionId
    }

    class RoleTracker {
        +String roleId
        +String trackerId
    }

    %% ==========================================
    %% PROJECT MANAGEMENT
    %% ==========================================
    class Project {
        +String id
        +String name
        +String description
        +String identifier
        +DateTime startDate
        +DateTime endDate
        +Boolean isArchived
        +Boolean isPublic
    }

    class ProjectMember {
        +String id
        +String projectId
        +String userId
        +String roleId
    }

    class MemberNotificationSetting {
        +Boolean notifyOnNew
        +Boolean notifyOnUpdate
        +Boolean notifyOnAssign
    }

    class ProjectTracker {
        +String projectId
        +String trackerId
    }

    %% ==========================================
    %% TASK ENGINE
    %% ==========================================
    class Task {
        +Int number
        +String title
        +String description
        +Int doneRatio
        +DateTime startDate
        +DateTime dueDate
        +Float estimatedHours
        +Int lockVersion
    }

    class Tracker {
        +String id
        +String name
        +Int position
        +Boolean isDefault
    }

    class Status {
        +String id
        +String name
        +Boolean isClosed
        +Boolean isDefault
        +Int defaultDoneRatio
    }

    class Priority {
        +String id
        +String name
        +Int position
        +String color
        +Boolean isDefault
    }

    class WorkflowTransition {
        +String trackerId
        +String roleId
        +String fromStatusId
        +String toStatusId
    }

    %% ==========================================
    %% SUPPORTING MODULES
    %% ==========================================
    class Version {
        +String id
        +String name
        +String status
        +DateTime dueDate
    }

    class IssueRelation {
        +String relationType
        +Int delay
    }

    class Comment {
        +String content
        +DateTime createdAt
    }

    class Attachment {
        +String filename
        +String path
        +Int size
        +String mimeType
    }

    class TimeLog {
        +Float hours
        +DateTime spentOn
    }

    class TimeEntryActivity {
        +String name
        +Int position
        +Boolean isDefault
    }

    class AuditLog {
        +String action
        +String entityType
        +String entityId
        +Json changes
    }

    class Notification {
        +String type
        +String title
        +String message
        +Boolean isRead
    }

    class Query {
        +String name
        +String filters
        +String columns
        +Boolean isPublic
    }

    class Watcher {
        +String taskId
        +String userId
    }

    %% ==========================================
    %% RELATIONSHIPS (STRICT ALIGNMENT)
    %% ==========================================

    User "1" -- "*" ProjectMember : belongs
    ProjectMember "*" -- "1" Role : has role
    Role "1" -- "*" RolePermission : defines
    RolePermission "*" -- "1" Permission : access
    Role "1" -- "*" RoleTracker : restricted to
    RoleTracker "*" -- "1" Tracker : uses

    Project "1" -- "*" ProjectMember : members
    Project "1" -- "*" Task : tasks
    Project "1" -- "*" Version : milestones
    Project "1" -- "*" ProjectTracker : allowed types
    ProjectTracker "*" -- "1" Tracker : config
    Project "1" -- "0..1" Project : parent-child
    ProjectMember "1" -- "0..1" MemberNotificationSetting : settings

    Task "*" -- "1" Tracker : type
    Task "*" -- "1" Status : status
    Task "*" -- "1" Priority : priority
    Task "*" -- "1" User : creator
    Task "*" -- "0..1" User : assignee
    Task "*" -- "0..1" Version : fixed_in
    Task "1" -- "*" Task : subtasks

    Task "1" -- "*" Comment : interacts
    Task "1" -- "*" Attachment : uploads
    Task "1" -- "*" Watcher : monitors
    Task "1" -- "*" TimeLog : records
    Task "1" -- "*" IssueRelation : linked
    
    Tracker "1" -- "*" WorkflowTransition : workflow
    WorkflowTransition "*" -- "1" Status : from/to
    TimeLog "*" -- "1" TimeEntryActivity : activity
    User "1" -- "*" AuditLog : tracks
    User "1" -- "*" Notification : notified
    User "1" -- "*" Query : manages
```

## 2. Giải thích thiết kế
- **RBAC & Security:** Hệ thống phân quyền đa lớp thông qua Role, Permission và các bảng trung gian như RoleTracker.
- **Project Structure:** Hỗ trợ cấu trúc dự án phân cấp và quản lý Tracker riêng biệt cho từng dự án.
- **Activity Tracking:** Mọi hành động đều được lưu nhật ký (Audit Log), theo dõi thời gian (Time Log) và thông báo (Notification) tới người dùng liên quan.

## 3. Tính nhất quán (Data Integrity)
- Sử dụng các bảng trung gian (RolePermission, RoleTracker, ProjectTracker) để đảm bảo mối quan hệ N-N được xử lý chuẩn xác theo lý thuyết Cơ sở dữ liệu quan hệ.
