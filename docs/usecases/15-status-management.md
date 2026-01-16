# Use Case Diagram 15: Quản lý Trạng thái (Status Management)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: System Configuration - Status  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Status Management |
| **Mô tả** | Các chức năng quản lý trạng thái công việc |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |
| **Source Files** | `src/app/api/statuses/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-51 - Xem danh sách trạng thái

---

#### 1. Mô tả
Xem tất cả trạng thái công việc trong hệ thống.

#### 2. Chuỗi sự kiện chính
1. Quản trị viên truy cập trang quản lý trạng thái.
2. Hệ thống truy vấn danh sách trạng thái với:
   - ID, tên, màu sắc
   - isClosed: đánh dấu trạng thái đóng
   - isDefault: đánh dấu trạng thái mặc định
   - defaultDoneRatio: % hoàn thành mặc định
   - position: thứ tự hiển thị
3. Sắp xếp theo position tăng dần.
4. Hiển thị danh sách.

---

### USE CASE: UC-52 - Tạo trạng thái mới

---

#### 1. Mô tả
Thêm trạng thái mới vào hệ thống.

#### 2. Tiền điều kiện
- Là quản trị viên.

#### 3. Chuỗi sự kiện chính
1. Admin nhấn "Thêm trạng thái".
2. Hiển thị form với các trường:
   - Tên (bắt buộc)
   - Màu sắc
   - Là trạng thái đóng
   - Là trạng thái mặc định
   - % hoàn thành mặc định
   - Vị trí
3. Admin nhập và lưu.
4. Nếu đặt là mặc định, reset isDefault của các status khác.
5. Tạo status mới.

---

### USE CASE: UC-53 - Cập nhật trạng thái

---

#### 1. Mô tả
Chỉnh sửa thông tin trạng thái.

#### 2. Lưu ý
- Nếu thay đổi isClosed, có thể ảnh hưởng đến doneRatio của công việc.
- Thay đổi isDefault sẽ reset các status khác.

---

### USE CASE: UC-54 - Xóa trạng thái

---

#### 1. Mô tả
Xóa trạng thái khỏi hệ thống.

#### 2. Tiền điều kiện
- Trạng thái không được sử dụng bởi công việc nào.
- Không phải trạng thái mặc định.

#### 3. Luồng ngoại lệ
- Nếu có công việc sử dụng: không cho xóa.
- Nếu là mặc định: không cho xóa.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Single Default | Chỉ có 1 status mặc định |
| BR-02 | Closed = 100% | isClosed = true thường đi kèm doneRatio = 100 |
| BR-03 | No Delete Used | Không xóa status đang được sử dụng |
| BR-04 | Position Order | Sắp xếp hiển thị theo position |

---

*Ngày cập nhật: 2026-01-16*
