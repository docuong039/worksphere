# Worksphere - Danh sách Activity Diagram cần vẽ

> **Tài liệu phân tích thiết kế hệ thống**  
> Dự án: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> Ngày cập nhật: 2026-01-15

---

## 📊 Phân tích & Lý do chọn

### Tiêu chí chọn Use Case để vẽ Activity Diagram

Activity Diagram được vẽ cho các Use Case có:
1. ✅ **Nhiều bước tuần tự** (> 5 bước)
2. ✅ **Rẽ nhánh điều kiện** (decision nodes)
3. ✅ **Xử lý song song** (fork/join)
4. ✅ **Nhiều actors tham gia** (swimlanes)
5. ✅ **Quy trình nghiệp vụ quan trọng**
6. ✅ **Có vòng lặp**

### Tiêu chí KHÔNG vẽ Activity Diagram

- ❌ UC đơn giản chỉ CRUD cơ bản (Create-Read-Update-Delete)
- ❌ UC chỉ hiển thị thông tin (view only)
- ❌ UC có luồng tuyến tính đơn giản không rẽ nhánh

---

## 📋 Tổng kết: 15 Activity Diagrams cần vẽ

| # | Use Case | Lý do cần vẽ |
|---|----------|--------------|
| 1 | UC-01: Đăng nhập | Quy trình xác thực, rẽ nhánh theo kết quả validation |
| 2 | UC-05: Tạo người dùng mới | Validate email, hash password, check duplicates |
| 3 | UC-10: Tạo dự án mới | Validate identifier, auto-assign creator role |
| 4 | UC-12: Xóa dự án | Cascade delete phức tạp, xác nhận nhiều bước |
| 5 | UC-14: Thêm thành viên vào dự án | Chọn users, gán roles, validate |
| 6 | UC-24: Tạo công việc mới | Nhiều validations, auto-generate number, subtask logic |
| 7 | UC-25: Cập nhật công việc | Optimistic locking, update parent, workflow check |
| 8 | UC-26: Thay đổi trạng thái | Workflow validation, transition check, update parent |
| 9 | UC-30: Thêm bình luận | Tạo comment, notify watchers, update task |
| 10 | UC-34: Tải lên file | Validate file, generate UUID, save to disk |
| 11 | UC-41: Sao chép công việc | Copy task, copy subtasks (optional), cross-project |
| 12 | UC-44: Tìm kiếm toàn cục | Search multiple entities, filter by permissions |
| 13 | UC-53: Xuất dữ liệu CSV/PDF | Query, filter, generate file |
| 14 | UC-72: Cập nhật Role & Permissions | Update role, sync permissions |
| 15 | UC-75: Cấu hình Workflow Transition | Matrix update, validate transitions |

---

## 📝 Chi tiết từng Activity Diagram

---

### AD-01: Đăng nhập (UC-01)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-01: Đăng nhập |
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Quy trình xác thực quan trọng
- Có nhiều điểm rẽ nhánh (email tồn tại?, password đúng?, account active?)
- Xử lý JWT session

**Các bước chính:**
1. User nhập email & password
2. System validate input format
3. System query user by email
4. [Decision] User tồn tại?
5. System compare password hash (bcrypt)
6. [Decision] Password đúng?
7. [Decision] Account active?
8. System create JWT session
9. Redirect to Dashboard

---

### AD-02: Tạo người dùng mới (UC-05)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-05: Tạo người dùng mới |
| **Actors** | Administrator |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | Admin, System, Database |

**Lý do vẽ:**
- Validate email unique
- Hash password với bcrypt
- Tạo user record

**Các bước chính:**
1. Admin nhập thông tin user
2. System validate required fields
3. [Decision] Email format valid?
4. System check email unique
5. [Decision] Email đã tồn tại?
6. System hash password (bcrypt, salt=10)
7. System create user record
8. Return success

---

### AD-03: Tạo dự án mới (UC-10)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-10: Tạo dự án mới |
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Validate identifier (unique, format)
- Tự động gán creator làm member với role Manager
- Nhiều bước xử lý

**Các bước chính:**
1. User nhập thông tin project
2. System validate required fields
3. System validate identifier format (lowercase, alphanumeric, dashes)
4. [Decision] Identifier unique?
5. System create project record
6. System create ProjectMember (creator = Manager)
7. Return project detail

---

### AD-04: Xóa dự án (UC-12)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-12: Xóa dự án |
| **Actors** | User (Creator/Admin) |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Cascade delete phức tạp (nhiều bảng liên quan)
- Cần xác nhận nhiều bước
- Quy trình không thể hoàn tác

**Các bước chính:**
1. User click Delete Project
2. System hiển thị warning dialog
3. User nhập tên project để xác nhận
4. [Decision] Tên khớp?
5. System check permission (creator hoặc admin)
6. [Decision] Có quyền?
7. [Fork] Cascade Delete:
   - Delete Tasks (và subtasks)
   - Delete Comments
   - Delete Attachments (files + records)
   - Delete Watchers
   - Delete ProjectMembers
   - Delete Versions
   - Delete Notifications
8. [Join]
9. System delete Project record
10. Redirect to Projects list

---

### AD-05: Thêm thành viên vào dự án (UC-14)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-14: Thêm thành viên vào dự án |
| **Actors** | User (với quyền manage_members) |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Có thể thêm nhiều users cùng lúc
- Validate user chưa là member
- Gán role cho member

**Các bước chính:**
1. User chọn users từ dropdown
2. User chọn role
3. [Loop] Với mỗi user được chọn:
   - [Decision] User đã là member?
   - Nếu chưa: Create ProjectMember record
4. [End Loop]
5. Refresh member list

---

### AD-06: Tạo công việc mới (UC-24)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-24: Tạo công việc mới |
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Nhiều validations
- Auto-generate task number
- Xử lý subtask (parentId)
- Tự động tính lại parent nếu là subtask

**Các bước chính:**
1. User nhập thông tin task
2. System validate required fields
3. System check permission `tasks.create`
4. [Decision] Có quyền?
5. System generate task number (auto-increment per project)
6. [Decision] Có parentId (là subtask)?
7. Nếu có: Validate parent exists trong project
8. System create Task record
9. [Decision] Có parentId?
10. Nếu có: Update parent attributes (dates, progress)
11. Create AuditLog record
12. Return task detail

---

### AD-07: Cập nhật công việc (UC-25)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-25: Cập nhật công việc |
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Optimistic locking (version check)
- Update parent nếu là subtask
- Permission check (edit_own vs edit_any)

**Các bước chính:**
1. User chỉnh sửa thông tin
2. System check permission
3. [Decision] edit_own hay edit_any?
4. System check version (optimistic locking)
5. [Decision] Version match?
6. Nếu không: Return conflict error
7. System update Task record
8. Increment version
9. [Decision] Task có parent?
10. Nếu có: Recalculate parent attributes
11. Create AuditLog record
12. Notify watchers

---

### AD-08: Thay đổi trạng thái (UC-26)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-26: Thay đổi trạng thái |
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- **Workflow validation quan trọng**
- Check WorkflowTransition
- Update doneRatio theo status
- Recalculate parent

**Các bước chính:**
1. User chọn status mới
2. System get current status, tracker, user's role
3. System query WorkflowTransition
4. [Decision] Transition được phép?
5. Nếu không: Return error "Không thể chuyển trạng thái"
6. System update status
7. [Decision] Status có defaultDoneRatio?
8. Nếu có: Update doneRatio
9. [Decision] Task có parent?
10. Nếu có: Recalculate parent progress
11. Create AuditLog
12. Notify watchers

---

### AD-09: Thêm bình luận (UC-30)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-30: Thêm bình luận |
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database, Notification Service |

**Lý do vẽ:**
- Tạo comment
- Update task.updatedAt
- Gửi notification cho watchers (có thể song song)

**Các bước chính:**
1. User nhập nội dung comment
2. System create Comment record
3. System update task.updatedAt
4. System get task watchers
5. [Fork - Parallel]:
   - Create Notification cho mỗi watcher
6. [Join]
7. Return comment

---

### AD-10: Tải lên file (UC-34)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-34: Tải lên file |
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, File System, Database |

**Lý do vẽ:**
- Validate file (size, type)
- Generate UUID filename
- Save to disk
- Create database record

**Các bước chính:**
1. User chọn file
2. System validate file size
3. [Decision] Size OK?
4. System validate file type
5. [Decision] Type allowed?
6. System generate UUID filename
7. System save file to public/uploads
8. System create Attachment record (filename, contentType, size)
9. Return attachment info

---

### AD-11: Sao chép công việc (UC-41)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-41: Sao chép công việc |
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Copy task sang project khác
- Option copy subtasks (recursive)
- Generate new task numbers

**Các bước chính:**
1. User click "Copy"
2. System hiển thị form với data điền sẵn
3. User chọn project đích
4. User check/uncheck "Copy subtasks"
5. User modify fields nếu cần
6. System check permission `tasks.create` ở project đích
7. [Decision] Có quyền?
8. System generate new task number
9. System create new Task
10. [Decision] Copy subtasks?
11. [Loop] Nếu có: Copy từng subtask recursive
12. [End Loop]
13. Redirect to new task

---

### AD-12: Tìm kiếm toàn cục (UC-44)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-44: Tìm kiếm toàn cục |
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Search nhiều entities (tasks, projects, comments, users)
- Filter theo permissions
- Kết quả phân nhóm

**Các bước chính:**
1. User nhập keyword
2. [Fork - Parallel Search]:
   - Search Tasks (title, description)
   - Search Projects (name, identifier)
   - Search Comments (content)
   - Search Users (name, email) - Admin only
3. [Join]
4. [Decision] User là Admin?
5. Nếu không: Filter kết quả theo projects user là member
6. Filter private tasks (chỉ hiển thị nếu creator/assignee)
7. Group results by type
8. Return results

---

### AD-13: Xuất dữ liệu CSV/PDF (UC-53)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-53: Xuất dữ liệu CSV/PDF |
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |

**Lý do vẽ:**
- Query với filters
- Generate file (CSV hoặc PDF)
- Download

**Các bước chính:**
1. User chọn filters (project, status, date range, etc.)
2. User chọn format (CSV/PDF)
3. System query tasks với filters
4. System apply permission filter
5. [Decision] Format = CSV?
6. Nếu CSV: Generate CSV file
7. Nếu PDF: Generate PDF file with jsPDF
8. Trigger download

---

### AD-14: Cập nhật Role & Permissions (UC-72)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-72: Cập nhật Role & Permissions |
| **Actors** | Administrator |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | Admin, System, Database |

**Lý do vẽ:**
- Update role attributes
- Sync permissions (add/remove)
- Transaction

**Các bước chính:**
1. Admin chỉnh sửa role info
2. Admin check/uncheck permissions
3. System update Role record
4. System get current RolePermissions
5. System calculate diff (to add, to remove)
6. [Fork]:
   - Delete removed RolePermissions
   - Create added RolePermissions
7. [Join]
8. Return updated role

---

### AD-15: Cấu hình Workflow Transition (UC-75)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-75: Cấu hình Workflow Transition |
| **Actors** | Administrator |
| **Độ phức tạp** | Cao |
| **Swimlanes** | Admin, System, Database |

**Lý do vẽ:**
- Matrix update phức tạp
- Nhiều records cần update
- Validate transitions

**Các bước chính:**
1. Admin chọn Tracker và Role
2. System load hiện trạng transitions
3. Admin check/uncheck cells trong matrix
4. System calculate changes
5. [Loop] Với mỗi cell thay đổi:
   - [Decision] Checked → Unchecked?
   - Nếu có: Delete WorkflowTransition
   - [Decision] Unchecked → Checked?
   - Nếu có: Create WorkflowTransition
6. [End Loop]
7. Refresh matrix

---

## 📊 Tổng hợp theo Module

| Module | Số Activity Diagrams | Use Cases |
|--------|---------------------|-----------|
| Authentication | 1 | UC-01 |
| User Management | 1 | UC-05 |
| Project Management | 2 | UC-10, UC-12 |
| Project Members | 1 | UC-14 |
| Task Management | 3 | UC-24, UC-25, UC-26 |
| Comments | 1 | UC-30 |
| Attachments | 1 | UC-34 |
| Task Copy | 1 | UC-41 |
| Global Search | 1 | UC-44 |
| Reports | 1 | UC-53 |
| Roles Config | 1 | UC-72 |
| Workflow Config | 1 | UC-75 |
| **TỔNG CỘNG** | **15** | |

---

## 🔧 Trạng thái vẽ

| # | Tên Activity Diagram | Use Case | Trạng thái |
|---|---------------------|----------|------------|
| 1 | AD-01: Đăng nhập | UC-01 | ⬜ Chưa vẽ |
| 2 | AD-02: Tạo người dùng mới | UC-05 | ⬜ Chưa vẽ |
| 3 | AD-03: Tạo dự án mới | UC-10 | ⬜ Chưa vẽ |
| 4 | AD-04: Xóa dự án | UC-12 | ⬜ Chưa vẽ |
| 5 | AD-05: Thêm thành viên | UC-14 | ⬜ Chưa vẽ |
| 6 | AD-06: Tạo công việc mới | UC-24 | ⬜ Chưa vẽ |
| 7 | AD-07: Cập nhật công việc | UC-25 | ⬜ Chưa vẽ |
| 8 | AD-08: Thay đổi trạng thái | UC-26 | ⬜ Chưa vẽ |
| 9 | AD-09: Thêm bình luận | UC-30 | ⬜ Chưa vẽ |
| 10 | AD-10: Tải lên file | UC-34 | ⬜ Chưa vẽ |
| 11 | AD-11: Sao chép công việc | UC-41 | ⬜ Chưa vẽ |
| 12 | AD-12: Tìm kiếm toàn cục | UC-44 | ⬜ Chưa vẽ |
| 13 | AD-13: Xuất dữ liệu CSV/PDF | UC-53 | ⬜ Chưa vẽ |
| 14 | AD-14: Cập nhật Role & Permissions | UC-72 | ⬜ Chưa vẽ |
| 15 | AD-15: Cấu hình Workflow | UC-75 | ⬜ Chưa vẽ |

---

## 📝 Ghi chú

### Tại sao không vẽ Activity Diagram cho các UC còn lại?

| Loại UC | Ví dụ | Lý do không vẽ |
|---------|-------|----------------|
| View/List UC | UC-04, UC-08, UC-17, UC-22, UC-54... | Chỉ query và hiển thị, không có logic phức tạp |
| Simple CRUD | UC-06, UC-11, UC-18, UC-56... | Luồng tuyến tính đơn giản, không rẽ nhánh |
| Toggle/Simple Action | UC-02, UC-38, UC-39, UC-43... | Chỉ 1-2 bước, quá đơn giản |
| Configuration | UC-63, UC-67... | CRUD cơ bản cho config entities |

### Priority vẽ

1. **Cao (Core Business):** AD-06, AD-07, AD-08 (Task Management)
2. **Cao (Security):** AD-01 (Authentication)
3. **Trung bình:** AD-03, AD-04, AD-11, AD-15
4. **Thấp:** Còn lại

---

*Tài liệu được tạo dựa trên phân tích 79 Use Cases của Worksphere*  
*Ngày tạo: 2026-01-15*
