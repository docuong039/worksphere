# Worksphere - Use Case Diagram

> **Tài liệu phân tích thiết kế hệ thống**  
> Dự án: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> Ngày cập nhật: 2026-01-15

---

## 1. Danh sách Actors

| STT | Actor | Mô tả |
|-----|-------|-------|
| 1 | **User** | Người dùng đã đăng nhập hệ thống. Quyền hạn phụ thuộc vào Role được gán trong từng Project. |
| 2 | **Administrator** | Quản trị viên hệ thống (`isAdministrator = true`). Có toàn quyền, không bị giới hạn bởi permission. |

**Quan hệ**: Administrator kế thừa (generalization) từ User.

---

## 2. Danh sách Use Cases (Đã gom nhóm)

### Tổng quan: **27 Use Cases chính**

---

### 📦 Package 1: Xác thực & Người dùng (Authentication & User Management)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 1 | UC01 | Đăng nhập | User | Người dùng nhập email/mật khẩu để đăng nhập hệ thống. Hệ thống xác thực và tạo phiên làm việc. |
| 2 | UC02 | Đăng xuất | User | Người dùng kết thúc phiên làm việc và thoát khỏi hệ thống. |
| 3 | UC03 | Quản lý tài khoản cá nhân | User | Người dùng xem và cập nhật thông tin cá nhân (tên, email, mật khẩu, avatar). |
| 4 | UC04 | Quản lý người dùng | Administrator | Admin thực hiện các thao tác CRUD người dùng: tạo, xem, sửa, xóa, vô hiệu hóa tài khoản, cấp quyền admin. |

---

### 📦 Package 2: Quản lý Dự án (Project Management)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 5 | UC05 | Quản lý dự án | User | Người dùng thực hiện các thao tác với dự án: xem danh sách, tạo mới, cập nhật thông tin, lưu trữ/khôi phục, xóa dự án. |
| 6 | UC06 | Quản lý thành viên dự án | User | Người dùng có quyền thêm/xóa thành viên, thay đổi vai trò thành viên trong dự án. |
| 7 | UC07 | Quản lý phiên bản | User | Người dùng quản lý các version/milestone của dự án: tạo, sửa, đóng, xóa phiên bản. |
| 8 | UC08 | Xem Roadmap | User | Người dùng xem lộ trình dự án với các phiên bản và công việc được nhóm theo milestone. |

---

### 📦 Package 3: Quản lý Công việc (Task Management)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 9 | UC10 | Xem danh sách công việc | User | Người dùng xem danh sách công việc với các chức năng: lọc, sắp xếp, nhóm, tìm kiếm, phân trang. |
| 10 | UC11 | Quản lý công việc | User | Người dùng thực hiện CRUD công việc: tạo, xem chi tiết, cập nhật thuộc tính, thay đổi trạng thái theo workflow, xóa. |
| 11 | UC12 | Quản lý công việc con | User | Người dùng tạo, liên kết, hủy liên kết công việc con (subtask) với công việc cha. |
| 12 | UC13 | Quản lý quan hệ công việc | User | Người dùng tạo và xóa quan hệ giữa các công việc (relates, blocks, duplicates, precedes, copied). |
| 13 | UC14 | Bình luận công việc | User | Người dùng thêm, sửa, xóa bình luận trên công việc để thảo luận và cập nhật tiến độ. |
| 14 | UC15 | Đính kèm file | User | Người dùng upload, download, xóa file đính kèm cho công việc. |
| 15 | UC16 | Theo dõi công việc | User | Người dùng đăng ký/hủy theo dõi công việc để nhận thông báo khi có thay đổi. |
| 16 | UC17 | Sao chép công việc | User | Người dùng sao chép công việc sang cùng dự án hoặc dự án khác với các tùy chọn copy subtasks, watchers, link. |
| 17 | UC18 | Di chuyển công việc | User | Người dùng di chuyển công việc từ dự án này sang dự án khác. |
| 18 | UC19 | Chỉnh sửa hàng loạt | User | Người dùng chọn nhiều công việc và cập nhật đồng thời các thuộc tính. |

---

### 📦 Package 4: Thông báo & Tìm kiếm (Notification & Search)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 19 | UC20 | Quản lý thông báo | User | Người dùng xem danh sách thông báo, đánh dấu đã đọc một hoặc tất cả thông báo. |
| 20 | UC21 | Tìm kiếm toàn cục | User | Người dùng tìm kiếm công việc, dự án, bình luận, người dùng trong toàn hệ thống. |
| 21 | UC22 | Quản lý bộ lọc đã lưu | User | Người dùng lưu, áp dụng, chia sẻ, cập nhật, xóa các bộ lọc công việc. |

---

### 📦 Package 5: Báo cáo & Thống kê (Reports)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 22 | UC23 | Xem Dashboard | User | Người dùng xem tổng quan: công việc được gán, quá hạn, sắp đến hạn, hoạt động gần đây, thống kê. |
| 23 | UC24 | Xem báo cáo thống kê | User | Người dùng xem báo cáo theo dự án, theo người dùng và xuất dữ liệu ra file CSV. |
| 24 | UC25 | Xem nhật ký hoạt động | User | Người dùng xem lịch sử hoạt động trong hệ thống, lọc theo dự án/người/loại. |
| 25 | UC28 | Phân bổ công việc (Workload) | User | Người dùng xem thống kê phân bổ giờ dự kiến (Project/User/Global). Admin thấy tất cả. |

---

### 📦 Package 6: Cấu hình Hệ thống (System Configuration) - Admin Only

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 26 | UC26 | Cấu hình dữ liệu nền | Administrator | Admin quản lý: Tracker, Status, Priority, Project Rules. |
| 27 | UC27 | Cấu hình phân quyền | Administrator | Admin quản lý Role, Permission và Workflow. |

---

## 3. Ma trận Actor - Use Case

| Use Case | User | Administrator |
|----------|:----:|:-------------:|
| UC01 - Đăng nhập | ✓ | ✓ |
| UC02 - Đăng xuất | ✓ | ✓ |
| UC03 - Quản lý tài khoản cá nhân | ✓ | ✓ |
| UC04 - Quản lý người dùng | | ✓ |
| UC05 - Quản lý dự án | ✓ | ✓ |
| UC06 - Quản lý thành viên dự án | ✓ | ✓ |
| UC07 - Quản lý phiên bản | ✓ | ✓ |
| UC08 - Xem Roadmap | ✓ | ✓ |
| UC10 - Xem danh sách công việc | ✓ | ✓ |
| UC11 - Quản lý công việc | ✓ | ✓ |
| UC12 - Quản lý công việc con | ✓ | ✓ |
| UC13 - Quản lý quan hệ công việc | ✓ | ✓ |
| UC14 - Bình luận công việc | ✓ | ✓ |
| UC15 - Đính kèm file | ✓ | ✓ |
| UC16 - Theo dõi công việc | ✓ | ✓ |
| UC17 - Sao chép công việc | ✓ | ✓ |
| UC18 - Di chuyển công việc | ✓ | ✓ |
| UC19 - Chỉnh sửa hàng loạt | ✓ | ✓ |
| UC20 - Quản lý thông báo | ✓ | ✓ |
| UC21 - Tìm kiếm toàn cục | ✓ | ✓ |
| UC22 - Quản lý bộ lọc đã lưu | ✓ | ✓ |
| UC23 - Xem Dashboard | ✓ | ✓ |
| UC24 - Xem báo cáo thống kê | ✓ | ✓ |
| UC25 - Xem nhật ký hoạt động | ✓ | ✓ |
| **UC28 - Phân bổ công việc** | ✓ | ✓ |
| UC26 - Cấu hình dữ liệu nền | | ✓ |
| UC27 - Cấu hình phân quyền | | ✓ |

---

## 4. Quan hệ giữa các Use Cases

### 4.1. Include (Bao gồm)

| Use Case chính | <<include>> | Use Case được gọi |
|----------------|-------------|-------------------|
| UC10 - Xem danh sách công việc | <<include>> | Lọc công việc |
| UC10 - Xem danh sách công việc | <<include>> | Sắp xếp công việc |
| UC10 - Xem danh sách công việc | <<include>> | Tìm kiếm công việc |
| UC11 - Quản lý công việc | <<include>> | Kiểm tra quyền (Permission Check) |
| UC11 - Quản lý công việc | <<include>> | Kiểm tra Workflow |
| UC17 - Sao chép công việc | <<include>> | Kiểm tra quyền tạo task |
| UC18 - Di chuyển công việc | <<include>> | Kiểm tra quyền di chuyển |
| UC24 - Xem báo cáo thống kê | <<include>> | Xuất CSV |
| UC28 - Phân bổ công việc | <<include>> | Lọc dữ liệu phân bổ |

### 4.2. Extend (Mở rộng)

| Use Case chính | <<extend>> | Use Case mở rộng | Điều kiện |
|----------------|------------|------------------|-----------|
| UC05 - Quản lý dự án | <<extend>> | Lưu trữ dự án | Khi dự án không còn hoạt động |
| UC11 - Quản lý công việc | <<extend>> | Cập nhật thuộc tính cha | Khi task có parent và cấu hình auto-update |
| UC11 - Quản lý công việc | <<extend>> | Gửi thông báo | Khi có watcher và task thay đổi |
| UC14 - Bình luận công việc | <<extend>> | Gửi thông báo | Khi thêm comment mới |
| UC16 - Theo dõi công việc | <<extend>> | Thêm người khác vào watcher | Khi có quyền quản lý watcher |
| UC28 - Phân bổ công việc | <<extend>> | Xem chi tiết đóng góp | Khi người dùng drill-down |

### 4.3. Generalization (Tổng quát hóa)

```
Administrator ───────▷ User
     │
     │ (kế thừa tất cả UC của User 
     │  + có thêm UC04, UC26, UC27)
```

---

## 5. Mô tả chi tiết Use Case (Use Case Specification)

*(Các UC01, UC05, UC11, UC26, UC27 giữ nguyên như trên, bổ sung UC28)*

### UC28 - Phân bổ công việc (Workload)

| Thuộc tính | Mô tả |
|------------|-------|
| **Mã UC** | UC28 |
| **Tên UC** | Phân bổ công việc |
| **Actor** | User, Administrator |
| **Mô tả** | Xem thống kê giờ dự kiến (Estimated Hours) theo Người dùng/Dự án |
| **Tiền điều kiện** | Đăng nhập hệ thống |
| **Hậu điều kiện** | Hiển thị bảng phân bổ thời gian |
| **Luồng chính** | 1. Chọn menu "Phân bổ việc"<br>2. Xem phân bổ cá nhân (My Workload)<br>3. Chọn dự án để xem phân bổ thành viên (Project Workload)<br>4. Click user để xem chi tiết task đóng góp |
| **Quy tắc nghiệp vụ** | - `timelogs.view_own`: Xem của chính mình<br>- `timelogs.view_all`: Xem của tất cả thành viên (bao gồm user 0h)<br>- Admin: Xem tất cả |

---

## 6. Mapping: Use Case Diagram → Use Case chi tiết

| UC Diagram (27) | UC Chi tiết trong docs/use-cases.md |
|-----------------|-------------------------------------|
| UC01 | UC-01, UC-02 |
| UC02 | (UC-02) |
| UC03 | UC-03 |
| UC04 | UC-04 ~ UC-07 |
| UC05 | UC-08 ~ UC-12 |
| UC06 | UC-13 ~ UC-16 |
| UC07 | UC-17 ~ UC-20 |
| UC08 | UC-21 |
| UC10 | UC-22 |
| UC11 | UC-23 ~ UC-28 |
| UC12 | (Nằm trong cấu trúc task cha/con) |
| UC13 | (Nằm trong cấu trúc task relation) |
| UC14 | UC-29 ~ UC-32 |
| UC15 | UC-33 ~ UC-36 |
| UC16 | UC-37 ~ UC-40 |
| UC17 | UC-41 |
| UC18 | (Tính năng di chuyển - Move Task) |
| UC19 | (Bulk Edit) |
| UC20 | UC-42 ~ UC-43 |
| UC21 | UC-44 |
| UC22 | UC-45 ~ UC-48 |
| UC23 | UC-49 |
| UC24 | UC-50 ~ UC-53 |
| UC25 | UC-81 |
| **UC28** | **UC-58 ~ UC-61** |
| UC26 | UC-54~57, UC-62~69, UC-79~80 |
| UC27 | UC-70~75, UC-76 |

---

## 7. Gợi ý vẽ Use Case Diagram

### Diagram 1: Tổng quan hệ thống (Overview)
Vẽ 27 UC chia thành 6 package (như trên).

---

*Tài liệu được tạo cho mục đích phân tích thiết kế hệ thống - Worksphere.*  
*Cập nhật lần cuối: 2026-01-15*
