# Use Case Diagram 17: Quản lý Loại công việc (Tracker Management)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: System Configuration - Tracker  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Tracker Management |
| **Mô tả** | Các chức năng quản lý loại công việc |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |
| **Source Files** | `src/app/api/trackers/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-59 - Xem danh sách Tracker

---

#### 1. Mô tả
Xem tất cả loại công việc trong hệ thống.

#### 2. Chuỗi sự kiện chính
1. Truy vấn danh sách tracker với:
   - ID, tên
   - isDefault
   - position
2. Sắp xếp theo position.
3. Hiển thị danh sách.

---

### USE CASE: UC-60 - Tạo Tracker mới

---

#### 1. Mô tả
Thêm loại công việc mới (ví dụ: Bug, Feature, Task).

#### 2. Chuỗi sự kiện chính
1. Admin nhập: tên, vị trí, đánh dấu mặc định.
2. Nếu là mặc định, reset các tracker khác.
3. Tạo tracker mới.

---

### USE CASE: UC-61 - Cập nhật Tracker

---

#### 1. Mô tả
Chỉnh sửa loại công việc.

---

### USE CASE: UC-62 - Xóa Tracker

---

#### 1. Mô tả
Xóa loại công việc.

#### 2. Tiền điều kiện
- Tracker không được sử dụng bởi công việc nào.
- Không phải mặc định.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Single Default | Chỉ có 1 tracker mặc định |
| BR-02 | No Delete Used | Không xóa tracker đang được sử dụng |
| BR-03 | Project Enable | Tracker cần được enable cho dự án (ProjectTracker) |
| BR-04 | Role Restrict | Có thể giới hạn tracker theo vai trò (RoleTracker) |

---

*Ngày cập nhật: 2026-01-16*
