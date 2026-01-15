# Worksphere - Use Case Diagram

> **Tài liệu phân tích thiết kế hệ thống**  
> Dự án: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> Ngày tạo: 2026-01-15

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
| 9 | UC09 | Quản lý danh mục công việc | User | Người dùng quản lý các category để phân loại công việc trong dự án. |

---

### 📦 Package 3: Quản lý Công việc (Task Management)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 10 | UC10 | Xem danh sách công việc | User | Người dùng xem danh sách công việc với các chức năng: lọc, sắp xếp, nhóm, tìm kiếm, phân trang. |
| 11 | UC11 | Quản lý công việc | User | Người dùng thực hiện CRUD công việc: tạo, xem chi tiết, cập nhật thuộc tính, thay đổi trạng thái theo workflow, xóa. |
| 12 | UC12 | Quản lý công việc con | User | Người dùng tạo, liên kết, hủy liên kết công việc con (subtask) với công việc cha. |
| 13 | UC13 | Quản lý quan hệ công việc | User | Người dùng tạo và xóa quan hệ giữa các công việc (relates, blocks, duplicates, precedes, copied). |
| 14 | UC14 | Bình luận công việc | User | Người dùng thêm, sửa, xóa bình luận trên công việc để thảo luận và cập nhật tiến độ. |
| 15 | UC15 | Đính kèm file | User | Người dùng upload, download, xóa file đính kèm cho công việc. |
| 16 | UC16 | Theo dõi công việc | User | Người dùng đăng ký/hủy theo dõi công việc để nhận thông báo khi có thay đổi. |
| 17 | UC17 | Sao chép công việc | User | Người dùng sao chép công việc sang cùng dự án hoặc dự án khác với các tùy chọn copy subtasks, watchers, link. |
| 18 | UC18 | Di chuyển công việc | User | Người dùng di chuyển công việc từ dự án này sang dự án khác. |
| 19 | UC19 | Chỉnh sửa hàng loạt | User | Người dùng chọn nhiều công việc và cập nhật đồng thời các thuộc tính. |

---

### 📦 Package 4: Thông báo & Tìm kiếm (Notification & Search)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 20 | UC20 | Quản lý thông báo | User | Người dùng xem danh sách thông báo, đánh dấu đã đọc một hoặc tất cả thông báo. |
| 21 | UC21 | Tìm kiếm toàn cục | User | Người dùng tìm kiếm công việc, dự án, bình luận, người dùng trong toàn hệ thống. |
| 22 | UC22 | Quản lý bộ lọc đã lưu | User | Người dùng lưu, áp dụng, chia sẻ, cập nhật, xóa các bộ lọc công việc. |

---

### 📦 Package 5: Báo cáo & Thống kê (Reports)

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 23 | UC23 | Xem Dashboard | User | Người dùng xem tổng quan: công việc được gán, quá hạn, sắp đến hạn, hoạt động gần đây, thống kê. |
| 24 | UC24 | Xem báo cáo thống kê | User | Người dùng xem báo cáo theo dự án, theo người dùng và xuất dữ liệu ra file CSV. |
| 25 | UC25 | Xem nhật ký hoạt động | User | Người dùng xem lịch sử hoạt động trong hệ thống, lọc theo dự án/người/loại. |

---

### 📦 Package 6: Cấu hình Hệ thống (System Configuration) - Admin Only

| STT | Mã UC | Tên Use Case | Actor | Mô tả |
|-----|-------|--------------|-------|-------|
| 26 | UC26 | Cấu hình dữ liệu nền | Administrator | Admin quản lý: Tracker (loại công việc), Status (trạng thái), Priority (độ ưu tiên). Bao gồm CRUD và đặt mặc định. |
| 27 | UC27 | Cấu hình phân quyền | Administrator | Admin quản lý Role (vai trò), gán Permission cho Role, cấu hình Workflow (chuyển đổi trạng thái), cài đặt Issue Tracking. |

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
| UC09 - Quản lý danh mục công việc | ✓ | ✓ |
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

### 4.2. Extend (Mở rộng)

| Use Case chính | <<extend>> | Use Case mở rộng | Điều kiện |
|----------------|------------|------------------|-----------|
| UC05 - Quản lý dự án | <<extend>> | Lưu trữ dự án | Khi dự án không còn hoạt động |
| UC11 - Quản lý công việc | <<extend>> | Cập nhật thuộc tính cha | Khi task có parent và cấu hình auto-update |
| UC11 - Quản lý công việc | <<extend>> | Gửi thông báo | Khi có watcher và task thay đổi |
| UC14 - Bình luận công việc | <<extend>> | Gửi thông báo | Khi thêm comment mới |
| UC16 - Theo dõi công việc | <<extend>> | Thêm người khác vào watcher | Khi có quyền quản lý watcher |

### 4.3. Generalization (Tổng quát hóa)

```
Administrator ───────▷ User
     │
     │ (kế thừa tất cả UC của User 
     │  + có thêm UC26, UC27)
```

---

## 5. Mô tả chi tiết Use Case (Use Case Specification)

### UC01 - Đăng nhập

| Thuộc tính | Mô tả |
|------------|-------|
| **Mã UC** | UC01 |
| **Tên UC** | Đăng nhập |
| **Actor** | User |
| **Mô tả** | Người dùng nhập thông tin đăng nhập để truy cập hệ thống |
| **Tiền điều kiện** | Người dùng có tài khoản trong hệ thống |
| **Hậu điều kiện** | Người dùng được xác thực và có phiên làm việc |
| **Luồng chính** | 1. Người dùng truy cập trang đăng nhập<br>2. Nhập email và mật khẩu<br>3. Hệ thống xác thực thông tin<br>4. Tạo phiên làm việc (JWT session)<br>5. Chuyển hướng đến Dashboard |
| **Luồng thay thế** | 3a. Email không tồn tại → Hiển thị lỗi<br>3b. Mật khẩu sai → Hiển thị lỗi<br>3c. Tài khoản bị vô hiệu hóa → Hiển thị lỗi |

---

### UC05 - Quản lý dự án

| Thuộc tính | Mô tả |
|------------|-------|
| **Mã UC** | UC05 |
| **Tên UC** | Quản lý dự án |
| **Actor** | User |
| **Mô tả** | Người dùng thực hiện các thao tác quản lý dự án |
| **Tiền điều kiện** | Người dùng đã đăng nhập |
| **Hậu điều kiện** | Dự án được tạo/cập nhật/xóa thành công |
| **Luồng chính - Tạo dự án** | 1. Chọn "Tạo dự án mới"<br>2. Nhập thông tin: tên, mã định danh, mô tả, ngày<br>3. Hệ thống kiểm tra quyền `projects.create`<br>4. Hệ thống kiểm tra mã định danh duy nhất<br>5. Tạo dự án và thêm người tạo làm Manager<br>6. Kích hoạt tất cả Trackers cho dự án |
| **Luồng thay thế** | 3a. Không có quyền → Hiển thị lỗi 403<br>4a. Mã định danh trùng → Hiển thị lỗi |
| **Quy tắc nghiệp vụ** | - Người tạo tự động có role Manager<br>- Non-admin chỉ xem dự án mình là member<br>- Xóa dự án = cascade xóa tất cả tasks, comments, attachments |

---

### UC11 - Quản lý công việc

| Thuộc tính | Mô tả |
|------------|-------|
| **Mã UC** | UC11 |
| **Tên UC** | Quản lý công việc |
| **Actor** | User |
| **Mô tả** | Người dùng thực hiện các thao tác CRUD công việc |
| **Tiền điều kiện** | Người dùng là thành viên dự án hoặc Admin |
| **Hậu điều kiện** | Công việc được tạo/cập nhật/xóa thành công |
| **Luồng chính - Tạo task** | 1. Chọn dự án và "Tạo công việc"<br>2. Nhập: tiêu đề, mô tả, loại, độ ưu tiên, assignee, ngày<br>3. Hệ thống kiểm tra quyền `tasks.create`<br>4. Gán trạng thái mặc định và số hiệu (#) tự động<br>5. Lưu và gửi thông báo cho assignee |
| **Luồng chính - Cập nhật** | 1. Mở chi tiết công việc<br>2. Chỉnh sửa thuộc tính<br>3. Kiểm tra quyền (edit_own/edit_assigned/edit_any)<br>4. Kiểm tra workflow nếu đổi trạng thái<br>5. Kiểm tra version (optimistic locking)<br>6. Lưu và cập nhật thuộc tính task cha (nếu có)<br>7. Ghi audit log và gửi thông báo |
| **Quy tắc nghiệp vụ** | - Workflow bắt buộc khi đổi trạng thái<br>- Task private chỉ creator/assignee thấy<br>- Auto-update parent attributes (dates, doneRatio, priority) |

---

### UC26 - Cấu hình dữ liệu nền

| Thuộc tính | Mô tả |
|------------|-------|
| **Mã UC** | UC26 |
| **Tên UC** | Cấu hình dữ liệu nền |
| **Actor** | Administrator |
| **Mô tả** | Admin quản lý các dữ liệu cấu hình: Tracker, Status, Priority |
| **Tiền điều kiện** | Người dùng có quyền Administrator |
| **Hậu điều kiện** | Dữ liệu cấu hình được cập nhật |
| **Luồng chính** | 1. Truy cập Settings<br>2. Chọn loại cấu hình (Trackers/Statuses/Priorities)<br>3. Thực hiện CRUD<br>4. Đặt mặc định (chỉ 1 item mỗi loại) |
| **Quy tắc nghiệp vụ** | - Không xóa nếu đang có task sử dụng<br>- Đặt default mới → tự động bỏ default cũ |

---

### UC27 - Cấu hình phân quyền

| Thuộc tính | Mô tả |
|------------|-------|
| **Mã UC** | UC27 |
| **Tên UC** | Cấu hình phân quyền |
| **Actor** | Administrator |
| **Mô tả** | Admin quản lý Role, Permission và Workflow |
| **Tiền điều kiện** | Người dùng có quyền Administrator |
| **Hậu điều kiện** | Cấu hình phân quyền được cập nhật |
| **Các chức năng con** | - Quản lý Role (CRUD, assignable, canAssignToOther)<br>- Gán Permission cho Role<br>- Gán Tracker cho Role<br>- Cấu hình Workflow (transition matrix)<br>- Cài đặt Issue Tracking (parent auto-calculation) |
| **Quy tắc nghiệp vụ** | - Không xóa role đang được sử dụng<br>- Workflow: định nghĩa transition theo (tracker, role, from_status, to_status) |

---

## 6. Mapping: Use Case Diagram → Use Case chi tiết

| UC Diagram (27) | UC Chi tiết trong docs/use-cases.md |
|-----------------|-------------------------------------|
| UC01 | UC-01, UC-02 |
| UC02 | (đã gom vào UC01) |
| UC03 | UC-03, UC-04 |
| UC04 | UC-05 ~ UC-10 |
| UC05 | UC-11 ~ UC-18 |
| UC06 | UC-19 ~ UC-22 |
| UC07 | UC-23 ~ UC-27 |
| UC08 | UC-28 |
| UC09 | UC-89 ~ UC-92 |
| UC10 | UC-29 ~ UC-33 |
| UC11 | UC-34 ~ UC-40 |
| UC12 | UC-41 ~ UC-44 |
| UC13 | UC-45 ~ UC-47 |
| UC14 | UC-48 ~ UC-51 |
| UC15 | UC-52 ~ UC-55 |
| UC16 | UC-56 ~ UC-61 |
| UC17 | UC-62, UC-63 |
| UC18 | UC-64 |
| UC19 | UC-65 |
| UC20 | UC-66 ~ UC-71 |
| UC21 | UC-72 ~ UC-74 |
| UC22 | UC-75 ~ UC-80 |
| UC23 | UC-81 |
| UC24 | UC-82 ~ UC-85, UC-86 ~ UC-88 |
| UC25 | UC-122 ~ UC-126 |
| UC26 | UC-93 ~ UC-102, UC-103 ~ UC-107 |
| UC27 | UC-108 ~ UC-121 |

---

## 7. Gợi ý vẽ Use Case Diagram

### Diagram 1: Tổng quan hệ thống (Overview)
Vẽ tất cả 27 UC với 2 Actors, chia thành các package như trên.

### Diagram 2: Chia theo Package (Chi tiết hơn)
- **Diagram 2a**: Package 1 + 2 (Auth + Project) - 9 UC
- **Diagram 2b**: Package 3 (Task Management) - 10 UC  
- **Diagram 2c**: Package 4 + 5 (Notification + Reports) - 5 UC
- **Diagram 2d**: Package 6 (Admin Config) - 2 UC

---

*Tài liệu được tạo cho mục đích phân tích thiết kế hệ thống - Worksphere.*  
*Cập nhật lần cuối: 2026-01-15*
