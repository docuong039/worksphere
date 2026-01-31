# DANH SÁCH USE CASE HỆ THỐNG WORKSPHERE

| STT | MÃ UC | TÊN USE CASE | Ý NGHĨA / GHI CHÚ |
| :-- | :--- | :--- | :--- |
| **I** | **QUẢN TRỊ & HỆ THỐNG** | | |
| 1 | UC-001 | **Đăng nhập** | Xác thực người dùng bằng Email/Password, hỗ trợ tự động đăng nhập nếu còn phiên (Session), kiểm tra trạng thái tài khoản active/inactive. |
| 2 | UC-002 | **Quản lý người dùng** | (Admin) Quản lý toàn bộ tài khoản hệ thống: Tạo mới, cấp lại mật khẩu, phân quyền quản trị viên, khóa/mở khóa tài khoản. |
| 3 | UC-003 | **Quản lý vai trò & Phần quyền** | (Admin) Định nghĩa các Roles (Manager, Developer...) và Permissions (quyền hạn) chi tiết cho từng vai trò trong dự án (RBAC). |
| 4 | UC-004 | **Quản lý Tracker** | (Admin) Định nghĩa các loại công việc (Bug, Feature, Task...), sắp xếp thứ tự hiển thị. |
| 5 | UC-005 | **Quản lý Trạng thái** | (Admin) Định nghĩa các trạng thái của công việc (New, In Progress, Closed...), thiết lập cờ "Đã đóng" cho trạng thái cuối. |
| 6 | UC-006 | **Quản lý Độ ưu tiên** | (Admin) Định nghĩa các mức độ ưu tiên (Normal, High, Urgent...), gán màu sắc hiển thị. |
| 7 | UC-007 | **Quản lý Hoạt động** | (Admin) Định nghĩa danh mục các hoạt động tính giờ (Design, Development, Meeting...). |
| 8 | UC-008 | **Quản lý Quy trình (Workflow)** | (Admin) Thiết lập ma trận chuyển đổi trạng thái cho từng cặp Role và Tracker (từ trạng thái nào được sang trạng thái nào). |
| **II** | **QUẢN LÝ DỰ ÁN** | | |
| 9 | UC-009 | **Quản lý Dự án** | Tạo lập dự án mới, cấu hình module (bật/tắt tính năng), thay đổi thông tin dự án, đóng/lưu trữ dự án. |
| 10 | UC-010 | **Quản lý Thành viên** | Thêm người dùng vào dự án, gán vai trò (Role), cập nhật vai trò hoặc xóa thành viên khỏi dự án. |
| 11 | UC-011 | **Quản lý Phiên bản (Version)** | Tạo lộ trình (Roadmap) cho dự án, quản lý các mốc phiên bản phát hành (Release), khóa/đóng phiên bản. |
| **III** | **VẬN HÀNH & CỘNG TÁC** | | |
| 12 | UC-012 | **Quản lý & Cộng tác Công việc** | Chức năng cốt lõi: Tạo, sửa, xóa task; cập nhật tiến độ; kéo thả Kanban; gán task cha-con; bình luận và đính kèm tệp. |
| 13 | UC-013 | **Quản lý Thời gian** | Ghi nhận giờ làm việc (Log time) cho từng công việc, sửa/xóa log cá nhân, tính toán tổng thời gian tiêu tốn. |
| 14 | UC-014 | **Báo cáo & Thống kê** | Xem tổng quan tiến độ dự án, biểu đồ phân bố công việc, xuất báo cáo chi tiết ra file CSV/PDF. |
| 15 | UC-015 | **Thông báo** | Hệ thống tự động gửi và hiển thị thông báo (Notification) cho người dùng khi có sự kiện liên quan (Task assigned, Commented...). |
