# Use Case Diagram 13: Bộ lọc đã lưu (Saved Queries)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Saved Queries  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Saved Queries |
| **Mô tả** | Các chức năng quản lý bộ lọc công việc đã lưu |
| **Số Use Cases** | 4 |
| **Actors** | User |
| **Source Files** | `src/app/api/queries/route.ts`, `src/app/api/queries/[id]/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-45 - Xem danh sách bộ lọc

---

#### 1. Mô tả
Xem danh sách bộ lọc công việc đã lưu, bao gồm bộ lọc của mình và bộ lọc công khai.

#### 2. Tác nhân chính
- **User**: Người dùng đã đăng nhập.

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.

#### 4. Đảm bảo thành công (Success Guarantee)
- Danh sách bộ lọc được hiển thị với đầy đủ thông tin.

#### 5. Chuỗi sự kiện chính (Main Flow)
1. Người dùng mở trang danh sách công việc.
2. Hệ thống truy vấn bộ lọc với logic OR:
   - Bộ lọc của chính mình (userId = session.user.id)
   - Bộ lọc công khai (isPublic = true)
   - Nếu Admin: tất cả bộ lọc (thêm empty object vào OR)
3. Nếu có projectId parameter, lọc thêm theo dự án.
4. Include thông tin:
   - user: { id, name }
   - project: { id, name, identifier }
5. Hệ thống sắp xếp: isPublic DESC, name ASC (công khai trước).
6. Hiển thị danh sách bộ lọc.
7. Kết thúc Use Case.

#### 6. Luồng ngoại lệ
- *Không có*

---

### USE CASE: UC-46 - Tạo bộ lọc mới

---

#### 1. Mô tả
Lưu bộ lọc hiện tại để sử dụng lại.

#### 2. Tác nhân chính
- **User**: Người dùng đã đăng nhập.

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.

#### 4. Đảm bảo tối thiểu
- Non-admin không thể tạo bộ lọc công khai nếu không có quyền.

#### 5. Đảm bảo thành công (Success Guarantee)
- Bộ lọc được tạo với các cấu hình đầy đủ.

#### 6. Chuỗi sự kiện chính (Main Flow)
1. Người dùng thiết lập các bộ lọc công việc.
2. Người dùng nhấn "Lưu bộ lọc".
3. Hệ thống hiển thị dialog với các trường:
   - name: Tên bộ lọc (bắt buộc)
   - isPublic: Công khai (checkbox)
4. Hệ thống validate:
   - name phải có và không rỗng sau khi trim
   - filters bắt buộc và phải là object
5. Nếu isPublic = true VÀ user không phải Admin:
   - Hệ thống kiểm tra quyền `queries.manage_public` qua ProjectMember.
   - Nếu có projectId: kiểm tra trong dự án đó.
   - Nếu không: kiểm tra bất kỳ vai trò nào có quyền.
6. Hệ thống lưu bộ lọc với:
   - name: name.trim()
   - projectId: projectId || null
   - userId: session.user.id
   - isPublic: isPublic || false
   - filters: JSON.stringify(filters)
   - columns: JSON.stringify(columns) hoặc null
   - sortBy: sortBy || null
   - sortOrder: sortOrder || 'asc'
   - groupBy: groupBy || null
7. Hiển thị thông báo thành công.
8. Kết thúc Use Case.

#### 7. Luồng ngoại lệ

**E1: Thiếu tên bộ lọc**
- Rẽ nhánh từ bước 4.
- Hệ thống trả về lỗi 400: "Vui lòng nhập tên bộ lọc".

**E2: Thiếu filters**
- Rẽ nhánh từ bước 4.
- Hệ thống trả về lỗi 400: "Tiêu chí lọc là bắt buộc".

**E3: Không có quyền tạo bộ lọc công khai**
- Rẽ nhánh từ bước 5.
- Hệ thống từ chối với mã lỗi 403.
- Hiển thị: "Không có quyền tạo bộ lọc công khai".

---

### USE CASE: UC-47 - Áp dụng bộ lọc

---

#### 1. Mô tả
Áp dụng bộ lọc đã lưu vào danh sách công việc.

#### 2. Chuỗi sự kiện chính
1. Người dùng chọn bộ lọc từ danh sách dropdown.
2. Hệ thống load cấu hình bộ lọc (parse JSON filters).
3. Hệ thống áp dụng filters, columns, sortBy, sortOrder, groupBy vào query.
4. Danh sách công việc được cập nhật.
5. Kết thúc Use Case.

---

### USE CASE: UC-48 - Xóa bộ lọc

---

#### 1. Mô tả
Xóa bộ lọc đã lưu.

#### 2. Tiền điều kiện
- Người dùng là chủ sở hữu bộ lọc hoặc admin.

#### 3. Chuỗi sự kiện chính
1. Người dùng nhấn nút "Xóa" trên bộ lọc.
2. Hệ thống hiển thị hộp thoại xác nhận.
3. Người dùng xác nhận xóa.
4. Hệ thống kiểm tra quyền:
   - Là chủ sở hữu (query.userId = session.user.id): cho phép.
   - Là Admin: cho phép.
5. Hệ thống xóa bộ lọc khỏi database.
6. Hiển thị thông báo thành công.
7. Kết thúc Use Case.

#### 4. Luồng ngoại lệ

**E1: Không có quyền xóa**
- Rẽ nhánh từ bước 4.
- Hệ thống từ chối với mã lỗi 403.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Own + Public | User xem được bộ lọc của mình + bộ lọc công khai |
| BR-02 | Admin All | Admin xem được tất cả bộ lọc |
| BR-03 | Public Permission | Tạo bộ lọc công khai cần quyền `queries.manage_public` |
| BR-04 | Store JSON | filters và columns được lưu dạng JSON.stringify() |
| BR-05 | Project Scope | Bộ lọc có thể gắn với dự án cụ thể (projectId) hoặc toàn hệ thống (null) |
| BR-06 | Order Priority | Sắp xếp: isPublic DESC, name ASC |
| BR-07 | Default sortOrder | Mặc định sortOrder = 'asc' |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/queries/route.ts`
- [x] Confirmed: GET OR logic cho own + public + admin
- [x] Confirmed: POST validation name và filters
- [x] Confirmed: Public query cần `queries.manage_public`
- [x] Confirmed: filterJSON được stringify

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
