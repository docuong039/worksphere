# Use Case: Quản lý Người dùng

Chi tiết các chức năng liên quan đến quản lý tài khoản người dùng trong hệ thống (Dành cho Quản trị viên).

```plantuml
@startuml
left to right direction
actor "Administrator" as Admin

usecase "đăng nhập" as UC_Login
usecase "quản lý người dùng" as UC_ManageUser

' Các use case con
usecase "xem danh sách người dùng" as UC01
usecase "tạo người dùng mới" as UC02
usecase "cập nhật thông tin/mật khẩu" as UC03
usecase "phân quyền quản trị viên" as UC04
usecase "xóa/khóa tài khoản" as UC05

Admin --> UC_ManageUser

UC_ManageUser --> UC01
UC_ManageUser --> UC02
UC_ManageUser --> UC03
UC_ManageUser --> UC04
UC_ManageUser --> UC05

UC_ManageUser ..> UC_Login : <<Include>>

@enduml
```

## Đặc tả Use Case: Quản lý Người dùng (UC-002)

| Mục | Nội dung |
| :--- | :--- |
| **Tên Use Case** | Quản lý Người dùng (System User Management) |
| **Mô tả** | Cho phép **Quản trị viên hệ thống (Administrator)** quản lý toàn bộ tài khoản người dùng trong hệ thống: bao gồm tạo mới, cấp lại mật khẩu, phân quyền quản trị và xóa tài khoản. Chức năng này độc lập với việc quản lý thành viên trong từng dự án. |
| **Tác nhân chính** | Administrator (Quản trị viên cấp cao) |
| **Tác nhân phụ** | Hệ thống (Database, Auth Service) |
| **Tiền điều kiện** | - Người dùng đã đăng nhập.<br>- Tài khoản phải có cờ `is_admin = true` trong cơ sở dữ liệu. |
| **Đảm bảo tối thiểu** | - Không cho phép tạo email trùng lặp.<br>- Không cho phép Admin xóa chính tài khoản mình đang đăng nhập. |
| **Đảm bảo thành công** | - User mới có thể đăng nhập ngay lập tức.<br>- User bị xóa/khóa sẽ mất quyền truy cập hệ thống ngay lập tức (hoặc sau khi hết hạn session). |

### Chuỗi sự kiện chính (Main Flow)

**Ngữ cảnh:** Admin truy cập vào menu **"Users" (Người dùng)** trên thanh điều hướng bên trái (Sidebar).

#### A. Xem danh sách người dùng
1.  **Administrator** truy cập trang `/users`.
2.  **Hệ thống** hiển thị danh sách tất cả tài khoản có trong bảng `User` của database.
    *   Thông tin hiển thị: Avatar, Tên (Name), Email, Vai trò hệ thống (Admin/Regular User).
3.  **Administrator** có thể tìm kiếm người dùng theo Tên hoặc Email thông qua thanh tìm kiếm.

#### B. Tạo tài khoản mới (Manually Create User)
4.  **Administrator** nhấn nút **"New User"** (hoặc dấu `+`).
5.  **Hệ thống** hiển thị Modal/Form tạo người dùng:
    *   Name (Bắt buộc).
    *   Email (Bắt buộc, Duy nhất).
    *   Password (Bắt buộc).
    *   Is Administrator? (Checkbox - Tùy chọn cấp quyền Admin ngay lập tức).
6.  **Administrator** điền thông tin và nhấn **"Create"**.
7.  **Hệ thống (API POST /api/users)**:
    *   Validate: Email hợp lệ, Mật khẩu đủ độ dài.
    *   Kiểm tra trùng Email trong DB.
    *   Mã hóa mật khẩu bằng BCrypt (`bcrypt.hash`).
    *   Lưu bản ghi vào bảng `User`.
8.  **Hệ thống** đóng Modal, hiển thị thông báo "User created successfully" và tự động làm mới danh sách (Re-fetch).

#### C. Cập nhật & Cấp lại mật khẩu (Update/Reset Password)
9.  **Administrator** nhấn vào nút **"Edit"** (hoặc icon bút chì) trên dòng của một user.
10. **Hệ thống** hiển thị Modal chỉnh sửa với thông tin hiện tại.
11. **Administrator** thực hiện thay đổi:
    *   Sửa tên hiển thị.
    *   Nhập mật khẩu mới vào ô "New Password" (nếu muốn reset mật khẩu cho user).
    *   Thay đổi quyền Admin (Toggle `is_admin`).
12. **Administrator** nhấn **"Update"**.
13. **Hệ thống (API PATCH /api/users/[id])**:
    *   Cập nhật thông tin xuống DB.
    *   (Nếu có đổi pass) Mã hóa lại mật khẩu mới.
14. **Hệ thống** thông báo thành công.

#### D. Xóa tài khoản (Delete User)
15. **Administrator** nhấn nút **"Delete"** (icon thùng rác) trên dòng user cần xóa.
16. **Hệ thống** hiển thị hộp thoại xác nhận (Confirm Dialog): "Are you sure you want to delete this user?".
17. **Administrator** xác nhận **"Delete"**.
18. **Hệ thống (API DELETE /api/users/[id])**:
    *   Kiểm tra user đó có phải là chính người đang thao tác không (Prevent self-delete).
    *   Thực hiện xóa bản ghi khỏi bảng `User`.
    *   *Lưu ý:* Việc xóa User có thể kéo theo xóa các dữ liệu liên quan hoặc set NULL tùy vào cấu hình Cascade của Database Prisma (ví dụ: `TimeLog`, `TaskComment`...).
19. **Hệ thống** xóa dòng đó khỏi giao diện và thông báo thành công.

### Luồng ngoại lệ (Exception Flows)

**E1. Email đã tồn tại**
*   *Tại bước B7:* API Backend phát hiện email trùng. Trả về lỗi 409 Conflict hoặc 400 Bad Request. Frontend hiển thị lỗi "Email already exists".

**E2. Xóa chính mình (Self-Delete)**
*   *Tại bước D18:* Backend so sánh `user_id` cần xóa với `current_user.id`. Nếu trùng, trả về lỗi 403 Forbidden: "You cannot delete your own account". Frontend hiển thị thông báo lỗi tương ứng.

### Quy tắc nghiệp vụ (Business Rules)
*   User được tạo ở đây là tài khoản đăng nhập vào hệ thống (**System Account**). Nó khác với **Project Member**. Sau khi có tài khoản này, User mới có thể được thêm vào các Dự án (Project) thông qua chức năng Quản lý thành viên.
*   Chỉ có Admin mới thấy menu "Users". Người dùng thường sẽ không truy cập được trang này (Middleware chặn).
