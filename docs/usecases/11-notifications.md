# Use Case Diagram 11: Thông báo (Notifications)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Notifications  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Notifications |
| **Mô tả** | Các chức năng quản lý thông báo người dùng |
| **Số Use Cases** | 2 |
| **Actors** | User |
| **Source Files** | `src/app/api/notifications/route.ts`, `src/lib/notifications.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-42 - Xem danh sách thông báo

---

#### 1. Mô tả
Use Case này cho phép người dùng xem danh sách thông báo của mình với tùy chọn lọc chỉ chưa đọc và giới hạn số lượng.

#### 2. Tác nhân chính
- **User**: Người dùng đã đăng nhập.

#### 3. Tác nhân phụ
- *Không có*

#### 4. Tiền điều kiện
- Người dùng đã đăng nhập vào hệ thống.

#### 5. Đảm bảo tối thiểu (Minimal Guarantee)
- Người dùng chỉ xem được thông báo của chính mình (userId = session.user.id).

#### 6. Đảm bảo thành công (Success Guarantee)
- Danh sách thông báo được hiển thị kèm số lượng chưa đọc.

#### 7. Chuỗi sự kiện chính (Main Flow)
1. Người dùng nhấn vào biểu tượng chuông thông báo.
2. Hệ thống đọc query parameters:
   - `unread`: true/false - chỉ lấy chưa đọc
   - `limit`: số lượng tối đa (mặc định 20)
3. Hệ thống truy vấn song song:
   - Danh sách thông báo (where: userId, filter unread nếu có)
   - Đếm số thông báo chưa đọc
4. Hệ thống sắp xếp theo createdAt giảm dần.
5. Hệ thống trả về:
   - `notifications`: danh sách thông báo
   - `unreadCount`: số chưa đọc
6. Hệ thống hiển thị dropdown thông báo với badge số lượng.
7. Kết thúc Use Case.

#### 8. Luồng thay thế (Alternative Flow)

**A1: Lọc chỉ chưa đọc**
- Rẽ nhánh từ bước 2.
- Người dùng chọn filter "Chưa đọc" (unread=true).
- Hệ thống lọc: `isRead: false`.
- Tiếp tục từ bước 3.

#### 9. Luồng ngoại lệ (Exception Flow)
- *Không có*

#### 10. Ghi chú
- Limit mặc định là 20 thông báo.
- unreadCount luôn được trả về để hiển thị badge.

---

### USE CASE: UC-43 - Đánh dấu đã đọc

---

#### 1. Mô tả
Use Case này cho phép người dùng đánh dấu một hoặc tất cả thông báo là đã đọc.

#### 2. Tác nhân chính
- **User**: Người dùng đã đăng nhập.

#### 3. Tác nhân phụ
- *Không có*

#### 4. Tiền điều kiện
- Người dùng đã đăng nhập vào hệ thống.

#### 5. Đảm bảo tối thiểu (Minimal Guarantee)
- Chỉ thông báo của chính người dùng được cập nhật (security filter: userId = session.user.id).

#### 6. Đảm bảo thành công (Success Guarantee)
- Thông báo được đánh dấu là đã đọc.
- Badge số lượng được cập nhật.

#### 7. Chuỗi sự kiện chính (Main Flow - Đánh dấu tất cả)
1. Người dùng nhấn "Đánh dấu tất cả đã đọc".
2. Hệ thống gửi yêu cầu PUT với `markAll: true`.
3. Hệ thống cập nhật tất cả thông báo chưa đọc của user:
   - WHERE: userId = session.user.id AND isRead = false
   - SET: isRead = true
4. Hệ thống trả về: `{ message: "Đã cập nhật" }`.
5. Badge được set về 0.
6. Kết thúc Use Case.

#### 8. Luồng thay thế (Alternative Flow)

**A1: Đánh dấu từng thông báo**
- Rẽ nhánh từ bước 1.
- Người dùng click vào một thông báo.
- Hệ thống gửi yêu cầu PUT với `notificationIds: [id1, id2...]`.
- Hệ thống cập nhật các thông báo được chỉ định:
  - WHERE: id IN notificationIds AND userId = session.user.id
  - SET: isRead = true
- Hệ thống chuyển người dùng đến nội dung liên quan.
- Badge được cập nhật.
- Kết thúc Use Case.

#### 9. Luồng ngoại lệ (Exception Flow)
- *Không có*

#### 10. Ghi chú
- Security: updateMany luôn filter bởi userId để ngăn user đánh dấu thông báo của người khác.
- Cả markAll và notificationIds đều được hỗ trợ trong một API.

---

## 7. Các loại thông báo (Notification Types)

| Type | Mô tả | Trigger | Tạo bởi |
|------|-------|---------|---------|
| task_assigned | Được gán công việc | Khi assigneeId thay đổi | `notifyTaskAssigned()` |
| task_status_changed | Trạng thái thay đổi | Khi statusId thay đổi | `notifyTaskStatusChanged()` |
| task_comment_added | Bình luận mới | Khi thêm comment | `notifyCommentAdded()` |

---

## 8. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | User Isolation | Người dùng chỉ xem/cập nhật được thông báo của mình |
| BR-02 | Exclude Actor | Người thực hiện hành động không nhận thông báo |
| BR-03 | Async Notify | Thông báo được tạo bất đồng bộ (không block response) |
| BR-04 | Security Filter | PUT updateMany luôn filter bởi userId |
| BR-05 | Default Limit | Mặc định lấy 20 thông báo |
| BR-06 | Order DESC | Sắp xếp theo thời gian tạo giảm dần |

---

## 9. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/notifications/route.ts`
- [x] Confirmed: GET trả về { notifications, unreadCount }
- [x] Confirmed: PUT hỗ trợ cả markAll và notificationIds
- [x] Confirmed: Security filter by userId trong updateMany

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
