# Use Case Diagram 19: Quản lý Workflow (Workflow Management)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: System Configuration - Workflow  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Workflow Management |
| **Mô tả** | Các chức năng quản lý quy trình chuyển đổi trạng thái |
| **Số Use Cases** | 2 |
| **Actors** | Administrator |
| **Source Files** | `src/app/api/workflow/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-67 - Xem cấu hình Workflow

---

#### 1. Mô tả
Xem bảng matrix các chuyển đổi trạng thái được phép cho một cặp tracker/role.

#### 2. Tác nhân chính
- **Administrator**: Quản trị viên hệ thống.

#### 3. Tiền điều kiện
- *Không yêu cầu quyền đặc biệt cho GET*.

#### 4. Đảm bảo thành công (Success Guarantee)
- Matrix workflow được hiển thị đầy đủ.

#### 5. Chuỗi sự kiện chính (Main Flow)
1. Admin truy cập trang Workflow Configuration.
2. Hệ thống truy vấn song song 3 danh sách:
   - Tất cả Trackers (orderBy position ASC)
   - Tất cả Statuses (orderBy position ASC)
   - Tất cả Roles (orderBy name ASC)
3. Admin chọn Tracker và Role để xem cấu hình.
4. Hệ thống truy vấn WorkflowTransition với filter:
   - Nếu có trackerId: filter theo tracker
   - Nếu có roleId: filter theo role (hoặc NULL)
5. Hệ thống trả về:
   - `trackers`: danh sách loại công việc
   - `statuses`: danh sách trạng thái
   - `roles`: danh sách vai trò
   - `transitions`: danh sách chuyển đổi được phép
6. Hệ thống hiển thị matrix:
   - Hàng: status nguồn (fromStatusId)
   - Cột: status đích (toStatusId)
   - Ô tích (✓): transition tồn tại → cho phép chuyển đổi
7. Kết thúc Use Case.

#### 6. Ghi chú
- Không yêu cầu admin cho GET, nhưng admin cần cho POST.
- roleId = NULL trong transition có nghĩa áp dụng cho TẤT CẢ vai trò.

---

### USE CASE: UC-68 - Cập nhật Workflow

---

#### 1. Mô tả
Chỉnh sửa các chuyển đổi trạng thái được phép cho một cặp tracker/role.

#### 2. Tác nhân chính
- **Administrator**: Quản trị viên hệ thống.

#### 3. Tiền điều kiện
- Người dùng là Quản trị viên.

#### 4. Đảm bảo tối thiểu (Minimal Guarantee)
- Non-admin không thể thay đổi workflow.

#### 5. Đảm bảo thành công (Success Guarantee)
- Transitions được cập nhật theo matrix mới.

#### 6. Chuỗi sự kiện chính (Main Flow)
1. Admin tick/untick các ô trong matrix.
2. Admin nhấn nút "Lưu".
3. Hệ thống validate input:
   - trackerId: bắt buộc
   - transitions: phải là mảng
4. Hệ thống XÓA TẤT CẢ transitions hiện tại cho cặp:
   - trackerId = input.trackerId
   - roleId = input.roleId || null
5. Hệ thống lọc transitions có `allowed: true`.
6. Hệ thống tạo mới các transitions đã lọc:
   - trackerId
   - roleId (hoặc null)
   - fromStatusId
   - toStatusId
7. Hệ thống sử dụng `createMany` để batch insert.
8. Hệ thống trả về:
   - `message`: "Đã cập nhật workflow"
   - `count`: số transitions đã tạo
9. Hiển thị thông báo thành công.
10. Kết thúc Use Case.

#### 7. Luồng ngoại lệ (Exception Flow)

**E1: Không phải Admin**
- Rẽ nhánh từ bước 2.
- Hệ thống từ chối với mã lỗi 403: "Không có quyền truy cập".

**E2: Thiếu trackerId**
- Rẽ nhánh từ bước 3.
- Hệ thống trả về lỗi 400: "Tracker ID là bắt buộc".

**E3: Transitions không phải mảng**
- Rẽ nhánh từ bước 3.
- Hệ thống trả về lỗi 400: "Transitions phải là một mảng".

#### 8. Ghi chú
- Cơ chế Delete-then-Create đảm bảo idempotent operation.
- Nếu không có transition nào allowed, tất cả sẽ bị xóa (count = 0).

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | roleId NULL | roleId = NULL áp dụng cho TẤT CẢ vai trò |
| BR-02 | Admin Only POST | Chỉ admin mới được cập nhật workflow |
| BR-03 | Tracker Required | trackerId là bắt buộc khi cập nhật |
| BR-04 | Delete-Create | Cơ chế: xóa tất cả transitions cũ rồi tạo mới |
| BR-05 | Batch Insert | Sử dụng createMany cho performance |
| BR-06 | Admin Bypass in Check | Khi check transition trong task update, admin bỏ qua workflow |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/workflow/route.ts` (98 dòng)
- [x] Confirmed: GET trả về trackers, statuses, roles, transitions
- [x] Confirmed: POST require admin (Line 51)
- [x] Confirmed: Delete all then create new (Line 66-87)
- [x] Confirmed: roleId || null handling (Line 70, 79)

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
