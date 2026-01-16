# Use Case Diagram 22: Xuất dữ liệu (Data Export)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Data Export  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Data Export |
| **Mô tả** | Chức năng xuất dữ liệu công việc |
| **Số Use Cases** | 1 |
| **Actors** | User |
| **Source Files** | `src/app/(dashboard)/reports/export/page.tsx` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-74 - Xuất công việc

---

#### 1. Mô tả
Xuất dữ liệu công việc hoặc tổng hợp ra file CSV. Hỗ trợ 3 loại:
- **tasks**: Danh sách công việc
- **project-summary**: Tổng hợp dự án
- **user-summary**: Tổng hợp nhân sự (Admin only)

#### 2. Tác nhân chính
- **User**: Thành viên có quyền xem công việc.

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.
- Có quyền xem công việc trong dự án.

#### 4. Chuỗi sự kiện chính (Main Flow)
1. Người dùng truy cập trang Export.
2. Chọn dự án (hoặc tất cả).
3. Áp dụng các filter:
   - Trạng thái, độ ưu tiên, loại công việc
   - Người được gán
   - Khoảng ngày
4. Chọn định dạng xuất: CSV hoặc PDF.
5. Nhấn "Xuất".
6. Hệ thống truy vấn công việc theo filter và quyền.
7. Hệ thống tạo file với các cột:
   - ID, Số, Tiêu đề, Mô tả
   - Loại, Trạng thái, Độ ưu tiên
   - Người được gán, Người tạo
   - Ngày bắt đầu, Ngày đến hạn
   - % Hoàn thành, Giờ ước tính
8. Hệ thống tải file về.

#### 5. Định dạng file

**CSV:**
- Encoding: UTF-8 with BOM
- Separator: comma
- Dates: yyyy-mm-dd format

**PDF:**
- Orientation: Landscape
- Columns: Subset của data (tối ưu cho đọc)

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Permission Filter | Dữ liệu được lọc theo quyền người dùng |
| BR-02 | Date Format | Ngày sử dụng yyyy-mm-dd để tránh lỗi Excel |
| BR-03 | UTF-8 BOM | CSV có BOM để Excel nhận dạng UTF-8 |
| BR-04 | Null Handling | Giá trị null được xuất thành chuỗi rỗng hoặc 0 |

---

*Ngày cập nhật: 2026-01-16*
