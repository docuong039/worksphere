# Use Case Diagram 21: Cài đặt Dự án (Project Settings)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Project Settings  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Project Settings |
| **Mô tả** | Các chức năng cài đặt riêng cho từng dự án |
| **Số Use Cases** | 3 |
| **Actors** | Project Manager, Administrator |
| **Source Files** | `src/app/api/projects/[id]/settings/route.ts`, `src/app/api/projects/[id]/trackers/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-71 - Cấu hình Trackers cho Dự án

---

#### 1. Mô tả
Bật/tắt các loại công việc được phép sử dụng trong dự án.

#### 2. Tác nhân chính
- **Project Manager**: Người có quyền quản lý dự án.
- **Administrator**: Quản trị viên.

#### 3. Tiền điều kiện
- Là creator dự án hoặc admin.

#### 4. Chuỗi sự kiện chính
1. Truy cập trang cài đặt dự án.
2. Mở tab "Loại công việc".
3. Hệ thống hiển thị danh sách trackers của hệ thống.
4. Đánh dấu trackers đang được bật (có trong ProjectTracker).
5. Manager tick/untick các trackers.
6. Nhấn "Lưu".
7. Hệ thống xóa tất cả ProjectTracker của dự án.
8. Hệ thống tạo mới các ProjectTracker đã tick.
9. Hiển thị thông báo thành công.

#### 5. Lưu ý
- Khi tạo dự án mới, tất cả trackers được tự động bật.
- Tắt tracker không ảnh hưởng đến công việc hiện có.

---

### USE CASE: UC-72 - Cấu hình Issue Tracking Settings

---

#### 1. Mô tả
Cấu hình các tùy chọn issue tracking riêng cho dự án.

#### 2. Các tùy chọn

| Tùy chọn | Mô tả |
|----------|-------|
| excludeSubtasksFromParentDoneRatio | Không tính subtasks khi tính doneRatio của parent |

#### 3. Chuỗi sự kiện chính
1. Truy cập tab "Issue Tracking".
2. Cấu hình các tùy chọn.
3. Nhấn "Lưu".
4. Hệ thống cập nhật project record.

---

### USE CASE: UC-73 - Quản lý Cài đặt Hiển thị

---

#### 1. Mô tả
Cấu hình các tùy chọn hiển thị cho dự án.

#### 2. Các tùy chọn (nếu có extension)
- Hiển thị subtasks inline
- Số công việc mỗi trang mặc định
- Cột hiển thị mặc định

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Auto Enable | Dự án mới tự động bật tất cả trackers |
| BR-02 | No Task Delete | Tắt tracker không xóa công việc đã tạo |
| BR-03 | Validation | Khi tạo task, tracker phải được bật cho dự án |
| BR-04 | Project Override | Cài đặt dự án ưu tiên hơn cài đặt hệ thống |

---

*Ngày cập nhật: 2026-01-16*
