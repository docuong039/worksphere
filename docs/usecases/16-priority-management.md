# Use Case Diagram 16: Quản lý Độ ưu tiên (Priority Management)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: System Configuration - Priority  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Priority Management |
| **Mô tả** | Các chức năng quản lý độ ưu tiên công việc |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |
| **Source Files** | `src/app/api/priorities/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-55 - Xem danh sách độ ưu tiên

---

#### 1. Mô tả
Xem tất cả độ ưu tiên trong hệ thống.

#### 2. Chuỗi sự kiện chính
1. Truy vấn danh sách priority với:
   - ID, tên, màu sắc
   - isDefault
   - position
2. Sắp xếp theo position.
3. Hiển thị danh sách.

---

### USE CASE: UC-56 - Tạo độ ưu tiên mới

---

#### 1. Mô tả
Thêm độ ưu tiên mới.

#### 2. Chuỗi sự kiện chính
1. Admin nhập: tên, màu sắc, vị trí, đánh dấu mặc định.
2. Nếu là mặc định, reset các priority khác.
3. Tạo priority mới.

---

### USE CASE: UC-57 - Cập nhật độ ưu tiên

---

#### 1. Mô tả
Chỉnh sửa độ ưu tiên.

---

### USE CASE: UC-58 - Xóa độ ưu tiên

---

#### 1. Mô tả
Xóa độ ưu tiên.

#### 2. Tiền điều kiện
- Priority không được sử dụng.
- Không phải mặc định.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Single Default | Chỉ có 1 priority mặc định |
| BR-02 | No Delete Used | Không xóa priority đang được sử dụng |
| BR-03 | Color Display | Màu được dùng để hiển thị trực quan |

---

*Ngày cập nhật: 2026-01-16*
