# Use Case Diagram 23: Xác thực Quyền (Permission Check)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: RBAC - Permission Check  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Permission Check |
| **Mô tả** | Internal Use Cases cho việc kiểm tra quyền |
| **Số Use Cases** | 3 (Internal) |
| **Actors** | System |
| **Source Files** | `src/lib/permissions.ts` |

---

## 2. Mô tả

Các Use Cases này là **internal** - được sử dụng như các include steps bởi các UC khác. Chúng không có Actors trực tiếp mà được gọi bởi hệ thống.

---

## 3. Đặc tả Use Case chi tiết

---

### USE CASE: UC-INT-01 - hasPermission

---

#### 1. Mô tả
Kiểm tra người dùng có permission key cụ thể trong scope nhất định.

#### 2. Input
- userId: ID người dùng
- permissionKey: Key quyền cần kiểm tra (vd: "tasks.create")
- projectId: (tùy chọn) ID dự án để giới hạn scope

#### 3. Logic
```
1. Nếu user.isAdministrator = true: return true
2. Nếu có projectId:
   - Tìm ProjectMember của user trong project
   - Get Role của member
   - Kiểm tra role có permission key
3. Nếu không có projectId:
   - Tìm tất cả ProjectMember của user
   - Kiểm tra bất kỳ role nào có permission key
```

#### 4. Output
- boolean: true nếu có quyền, false nếu không

---

### USE CASE: UC-INT-02 - canEditTask

---

#### 1. Mô tả
Kiểm tra người dùng có thể chỉnh sửa công việc cụ thể.

#### 2. Input
- userId: ID người dùng
- taskId: ID công việc
- isAdmin: boolean

#### 3. Logic
```
1. Nếu isAdmin = true: return true
2. Lấy thông tin task: creatorId, assigneeId, projectId
3. Lấy membership và permissions của user trong project
4. Kiểm tra theo thứ tự:
   a. tasks.edit_any: return true
   b. tasks.edit_own AND creatorId = userId: return true
   c. tasks.edit_assigned AND assigneeId = userId: return true
5. return false
```

#### 4. Output
- boolean: true nếu có thể sửa

---

### USE CASE: UC-INT-03 - canTransitionStatus

---

#### 1. Mô tả
Kiểm tra người dùng có thể chuyển công việc sang trạng thái mới theo workflow.

#### 2. Input
- user: Session user object
- taskId: ID công việc
- newStatusId: ID trạng thái đích

#### 3. Logic
```
1. Nếu user.isAdministrator = true: return true
2. Lấy thông tin task: trackerId, statusId (hiện tại), projectId
3. Lấy roleId của user trong project
4. Tìm WorkflowTransition với:
   - trackerId = task.trackerId
   - fromStatusId = task.statusId
   - toStatusId = newStatusId
   - roleId = NULL (universal) OR roleId = user.roleId
5. return transition tồn tại
```

#### 4. Output
- boolean: true nếu chuyển đổi được phép

---

## 4. Danh sách Permission Keys

| Key | Mô tả |
|-----|-------|
| projects.create | Tạo dự án |
| projects.manage_members | Quản lý thành viên dự án |
| projects.manage_versions | Quản lý phiên bản dự án |
| tasks.view_project | Xem công việc trong dự án |
| tasks.create | Tạo công việc |
| tasks.edit_any | Sửa bất kỳ công việc nào |
| tasks.edit_own | Sửa công việc đã tạo |
| tasks.edit_assigned | Sửa công việc được gán |
| queries.manage_public | Quản lý bộ lọc công khai |

---

## 5. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Admin Bypass | Admin luôn trả về true |
| BR-02 | Project Scope | Quyền thường được kiểm tra trong scope dự án |
| BR-03 | Priority Order | Edit permissions kiểm tra theo thứ tự: edit_any > edit_own > edit_assigned |
| BR-04 | roleId NULL | WorkflowTransition với roleId=NULL áp dụng cho tất cả |
| BR-05 | Explicit true | canAssignToOther yêu cầu giá trị boolean true tường minh |

---

*Ngày cập nhật: 2026-01-16*
