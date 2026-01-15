# Worksphere - Danh sách Sơ đồ Use Case cần vẽ

> **Tài liệu phân tích thiết kế hệ thống**  
> Dự án: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> Ngày cập nhật: 2026-01-15

---

## 📊 Tổng quan

- **Tổng số sơ đồ cần vẽ**: 24 sơ đồ
- **Cấu trúc**: 1 sơ đồ tổng quát + 23 sơ đồ chi tiết theo module
- **Tổng số Use Cases**: 79 UC

---

## 📋 Danh sách 24 Sơ đồ Use Case

### 🌐 Sơ đồ 0: Tổng quát hệ thống (System Overview)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - System Overview |
| **Loại** | Overview (Tổng quan) |
| **Mô tả** | Sơ đồ tổng quát thể hiện toàn bộ hệ thống với 2 actors chính và 23 subsystems/packages |
| **Actors** | User, Administrator |
| **Nội dung** | 23 packages đại diện cho 23 modules chức năng |

---

### 📦 Module 1: Xác thực (Authentication)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Authentication |
| **Số Use Cases** | 3 |
| **Actors** | User |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-01 | Đăng nhập |
| 2 | UC-02 | Đăng xuất |
| 3 | UC-03 | Xem thông tin tài khoản |

---

### 📦 Module 2: Quản lý Người dùng (User Management)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - User Management |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-04 | Xem danh sách người dùng |
| 2 | UC-05 | Tạo người dùng mới |
| 3 | UC-06 | Cập nhật thông tin người dùng |
| 4 | UC-07 | Xóa người dùng |

---

### 📦 Module 3: Quản lý Dự án (Project Management)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Project Management |
| **Số Use Cases** | 5 |
| **Actors** | User (với quyền tương ứng), Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-08 | Xem danh sách dự án |
| 2 | UC-09 | Xem chi tiết dự án |
| 3 | UC-10 | Tạo dự án mới |
| 4 | UC-11 | Cập nhật thông tin dự án |
| 5 | UC-12 | Xóa dự án |

---

### 📦 Module 4: Quản lý Thành viên Dự án (Project Members)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Project Members |
| **Số Use Cases** | 4 |
| **Actors** | User (với quyền `projects.manage_members`) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-13 | Xem danh sách thành viên |
| 2 | UC-14 | Thêm thành viên vào dự án |
| 3 | UC-15 | Thay đổi vai trò thành viên |
| 4 | UC-16 | Xóa thành viên khỏi dự án |

---

### 📦 Module 5: Quản lý Phiên bản (Versions/Milestones)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Versions Management |
| **Số Use Cases** | 5 |
| **Actors** | User (với quyền `projects.manage_versions`) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-17 | Xem danh sách phiên bản |
| 2 | UC-18 | Tạo phiên bản mới |
| 3 | UC-19 | Cập nhật phiên bản |
| 4 | UC-20 | Xóa phiên bản |
| 5 | UC-21 | Xem Roadmap |

---

### 📦 Module 6: Quản lý Công việc (Task Management)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Task Management |
| **Số Use Cases** | 7 |
| **Actors** | User (với quyền tasks.*) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-22 | Xem danh sách công việc |
| 2 | UC-23 | Xem chi tiết công việc |
| 3 | UC-24 | Tạo công việc mới |
| 4 | UC-25 | Cập nhật công việc |
| 5 | UC-26 | Thay đổi trạng thái |
| 6 | UC-27 | Gán công việc |
| 7 | UC-28 | Xóa công việc |

---

### 📦 Module 7: Bình luận (Comments)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Comments |
| **Số Use Cases** | 4 |
| **Actors** | User (thành viên dự án) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-29 | Xem bình luận |
| 2 | UC-30 | Thêm bình luận |
| 3 | UC-31 | Sửa bình luận |
| 4 | UC-32 | Xóa bình luận |

---

### 📦 Module 8: File đính kèm (Attachments)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Attachments |
| **Số Use Cases** | 4 |
| **Actors** | User (thành viên dự án) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-33 | Xem file đính kèm |
| 2 | UC-34 | Tải lên file |
| 3 | UC-35 | Tải xuống file |
| 4 | UC-36 | Xóa file đính kèm |

---

### 📦 Module 9: Theo dõi Công việc (Watchers)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Watchers |
| **Số Use Cases** | 4 |
| **Actors** | User (thành viên dự án) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-37 | Xem người theo dõi |
| 2 | UC-38 | Theo dõi công việc |
| 3 | UC-39 | Hủy theo dõi |
| 4 | UC-40 | Thêm người theo dõi khác |

---

### 📦 Module 10: Sao chép Công việc (Task Copy)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Task Copy |
| **Số Use Cases** | 1 |
| **Actors** | User (với quyền `tasks.create`) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-41 | Sao chép công việc |

---

### 📦 Module 11: Thông báo (Notifications)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Notifications |
| **Số Use Cases** | 2 |
| **Actors** | User |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-42 | Xem danh sách thông báo |
| 2 | UC-43 | Đánh dấu đã đọc |

---

### 📦 Module 12: Tìm kiếm Toàn cục (Global Search)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Global Search |
| **Số Use Cases** | 1 |
| **Actors** | User |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-44 | Tìm kiếm toàn cục |

---

### 📦 Module 13: Bộ lọc đã lưu (Saved Queries)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Saved Queries |
| **Số Use Cases** | 4 |
| **Actors** | User |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-45 | Xem bộ lọc đã lưu |
| 2 | UC-46 | Lưu bộ lọc mới |
| 3 | UC-47 | Chia sẻ bộ lọc |
| 4 | UC-48 | Xóa bộ lọc |

---

### 📦 Module 14: Dashboard & Báo cáo (Reports)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Dashboard & Reports |
| **Số Use Cases** | 5 |
| **Actors** | User, Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-49 | Xem Dashboard |
| 2 | UC-50 | Xem báo cáo tổng hợp |
| 3 | UC-51 | Xem báo cáo theo dự án |
| 4 | UC-52 | Xem báo cáo theo người dùng |
| 5 | UC-53 | Xuất dữ liệu CSV |

---

### 📦 Module 15: Cấu hình Trackers (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Trackers Configuration |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-54 | Xem danh sách Tracker |
| 2 | UC-55 | Tạo Tracker |
| 3 | UC-56 | Cập nhật Tracker |
| 4 | UC-57 | Xóa Tracker |

---

### 📦 Module 16: Phân bổ Công việc (Workload)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Workload |
| **Số Use Cases** | 4 |
| **Actors** | User, Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-58 | Xem phân bổ cá nhân |
| 2 | UC-59 | Xem phân bổ dự án |
| 3 | UC-60 | Xem phân bổ toàn cục |
| 4 | UC-61 | Xem chi tiết đóng góp |

---

### 📦 Module 17: Cấu hình Statuses (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Statuses Configuration |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-62 | Xem danh sách Status |
| 2 | UC-63 | Tạo Status |
| 3 | UC-64 | Cập nhật Status |
| 4 | UC-65 | Xóa Status |

---

### 📦 Module 18: Cấu hình Priorities (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Priorities Configuration |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-66 | Xem danh sách Priority |
| 2 | UC-67 | Tạo Priority |
| 3 | UC-68 | Cập nhật Priority |
| 4 | UC-69 | Xóa Priority |

---

### 📦 Module 19: Cấu hình Roles (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Roles Configuration |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-70 | Xem danh sách Role |
| 2 | UC-71 | Tạo Role |
| 3 | UC-72 | Cập nhật Role |
| 4 | UC-73 | Xóa Role |

---

### 📦 Module 20: Cấu hình Workflow (Admin)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Workflow Configuration |
| **Số Use Cases** | 2 |
| **Actors** | Administrator |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-74 | Xem Workflow Matrix |
| 2 | UC-75 | Cấu hình Transition |

---

### 📦 Module 21: Cấu hình Issue Tracking (Project Settings)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Project Issue Settings |
| **Số Use Cases** | 1 |
| **Actors** | User (Project Manager/Creator) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-76 | Cấu hình quy tắc tính toán |

---

### 📦 Module 22: Cấu hình Trackers cho Dự án (Project Trackers)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Project Trackers |
| **Số Use Cases** | 2 |
| **Actors** | User (Project Manager/Creator) |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-79 | Xem Tracker của dự án |
| 2 | UC-80 | Chọn Tracker cho dự án |

---

### 📦 Module 23: Nhật ký Hoạt động (Activity Log)

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Activity Log |
| **Số Use Cases** | 1 |
| **Actors** | User |

**Danh sách Use Cases:**
| STT | Mã UC | Tên Use Case |
|-----|-------|--------------|
| 1 | UC-81 | Xem hoạt động gần đây |

---

## 📈 Bảng tổng kết

| # | Tên sơ đồ | Loại | Số UC | Actors chính |
|---|-----------|------|-------|--------------|
| 0 | System Overview | Overview | — | User, Administrator |
| 1 | Authentication | Chi tiết | 3 | User |
| 2 | User Management | Chi tiết | 4 | Administrator |
| 3 | Project Management | Chi tiết | 5 | User, Administrator |
| 4 | Project Members | Chi tiết | 4 | User |
| 5 | Versions Management | Chi tiết | 5 | User |
| 6 | Task Management | Chi tiết | 7 | User |
| 7 | Comments | Chi tiết | 4 | User |
| 8 | Attachments | Chi tiết | 4 | User |
| 9 | Watchers | Chi tiết | 4 | User |
| 10 | Task Copy | Chi tiết | 1 | User |
| 11 | Notifications | Chi tiết | 2 | User |
| 12 | Global Search | Chi tiết | 1 | User |
| 13 | Saved Queries | Chi tiết | 4 | User |
| 14 | Dashboard & Reports | Chi tiết | 5 | User, Administrator |
| 15 | Trackers Configuration | Chi tiết | 4 | Administrator |
| 16 | Workload | Chi tiết | 4 | User, Administrator |
| 17 | Statuses Configuration | Chi tiết | 4 | Administrator |
| 18 | Priorities Configuration | Chi tiết | 4 | Administrator |
| 19 | Roles Configuration | Chi tiết | 4 | Administrator |
| 20 | Workflow Configuration | Chi tiết | 2 | Administrator |
| 21 | Project Issue Settings | Chi tiết | 1 | User (PM) |
| 22 | Project Trackers | Chi tiết | 2 | User (PM) |
| 23 | Activity Log | Chi tiết | 1 | User |
| | **TỔNG CỘNG** | **24 sơ đồ** | **79 UC** | |

---

## 🔧 Trạng thái vẽ

| # | Tên sơ đồ | Trạng thái | Ghi chú |
|---|-----------|------------|---------|
| 0 | System Overview | ⬜ Chưa vẽ | |
| 1 | Authentication | ⬜ Chưa vẽ | |
| 2 | User Management | ⬜ Chưa vẽ | |
| 3 | Project Management | ⬜ Chưa vẽ | |
| 4 | Project Members | ⬜ Chưa vẽ | |
| 5 | Versions Management | ⬜ Chưa vẽ | |
| 6 | Task Management | ⬜ Chưa vẽ | |
| 7 | Comments | ⬜ Chưa vẽ | |
| 8 | Attachments | ⬜ Chưa vẽ | |
| 9 | Watchers | ⬜ Chưa vẽ | |
| 10 | Task Copy | ⬜ Chưa vẽ | |
| 11 | Notifications | ⬜ Chưa vẽ | |
| 12 | Global Search | ⬜ Chưa vẽ | |
| 13 | Saved Queries | ⬜ Chưa vẽ | |
| 14 | Dashboard & Reports | ⬜ Chưa vẽ | |
| 15 | Trackers Configuration | ⬜ Chưa vẽ | |
| 16 | Workload | ⬜ Chưa vẽ | |
| 17 | Statuses Configuration | ⬜ Chưa vẽ | |
| 18 | Priorities Configuration | ⬜ Chưa vẽ | |
| 19 | Roles Configuration | ⬜ Chưa vẽ | |
| 20 | Workflow Configuration | ⬜ Chưa vẽ | |
| 21 | Project Issue Settings | ⬜ Chưa vẽ | |
| 22 | Project Trackers | ⬜ Chưa vẽ | |
| 23 | Activity Log | ⬜ Chưa vẽ | |

---

*Tài liệu được tạo dựa trên phân tích file use-cases.md*  
*Cập nhật lần cuối: 2026-01-15*
