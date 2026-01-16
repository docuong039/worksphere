# Use Case Diagram 12: Tìm kiếm toàn cục (Global Search)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Global Search  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Global Search |
| **Mô tả** | Chức năng tìm kiếm toàn cục trên hệ thống |
| **Số Use Cases** | 1 |
| **Actors** | User |
| **Source Files** | `src/app/api/search/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-44 - Tìm kiếm toàn cục

---

#### 1. Mô tả
Use Case này cho phép người dùng tìm kiếm trên nhiều loại đối tượng trong hệ thống: công việc, dự án, bình luận và người dùng. Kết quả được lọc theo quyền.

#### 2. Tác nhân chính
- **User**: Người dùng đã đăng nhập.

#### 3. Tác nhân phụ
- *Không có*

#### 4. Tiền điều kiện
- Người dùng đã đăng nhập vào hệ thống.
- Từ khóa tìm kiếm phải có ít nhất 2 ký tự.

#### 5. Đảm bảo tối thiểu (Minimal Guarantee)
- Kết quả được lọc theo quyền của người dùng.
- Công việc trong dự án người dùng không thuộc sẽ không hiển thị.

#### 6. Đảm bảo thành công (Success Guarantee)
- Kết quả tìm kiếm phù hợp được hiển thị.
- Số lượng kết quả mỗi loại được trả về.

#### 7. Chuỗi sự kiện chính (Main Flow)
1. Người dùng nhấn Ctrl+K hoặc click vào ô tìm kiếm.
2. Hệ thống hiển thị dialog tìm kiếm.
3. Người dùng nhập từ khóa (tối thiểu 2 ký tự).
4. Hệ thống xác định projectFilter theo quyền:
   - Admin: không filter (xem tất cả)
   - User: chỉ dự án có members chứa userId
5. Hệ thống tìm kiếm song song 4 loại đối tượng:
   - **Tasks** (limit 20): Tìm theo title, description
     - Filter: project phải trong projectFilter
   - **Projects** (limit 10): Tìm theo name, identifier, description
     - Filter: theo projectFilter và isArchived = false
   - **Comments** (limit 10): Tìm theo content
     - Filter: task.project phải trong projectFilter
   - **Users** (limit 10): Tìm theo name, email
     - Admin: tất cả users active
     - User: chỉ users trong dự án chung (deduplicated)
6. Hệ thống trả về:
   - query: từ khóa đã trim
   - results: { tasks, projects, comments, users }
   - counts: số lượng mỗi loại
7. Hệ thống hiển thị kết quả phân theo nhóm.
8. Người dùng chọn một kết quả.
9. Hệ thống điều hướng đến trang chi tiết.
10. Kết thúc Use Case.

#### 8. Luồng thay thế (Alternative Flow)

**A1: Tìm kiếm theo loại cụ thể**
- Rẽ nhánh từ bước 4.
- Người dùng chọn filter type: tasks, projects, comments, users.
- Hệ thống chỉ tìm trong loại được chọn.
- Tiếp tục từ bước 5 (chỉ query loại đã chọn).

#### 9. Luồng ngoại lệ (Exception Flow)

**E1: Từ khóa quá ngắn**
- Rẽ nhánh từ bước 3.
- Nếu từ khóa < 2 ký tự: Hệ thống trả về lỗi.
- Thông báo: "Query phải có ít nhất 2 ký tự".
- Kết thúc Use Case.

**E2: Không tìm thấy kết quả**
- Rẽ nhánh từ bước 6.
- Counts = 0 cho tất cả loại.
- Hệ thống hiển thị "Không tìm thấy kết quả".
- Kết thúc Use Case.

#### 10. Ghi chú
- Toán tử `contains` được sử dụng - tìm kiếm substring.
- Admin thấy tất cả nội dung.
- Non-admin bị giới hạn trong phạm vi dự án là thành viên.
- Users search cho non-admin: tìm qua ProjectMember và deduplicate theo userId.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Min Query Length | Từ khóa tối thiểu 2 ký tự |
| BR-02 | Admin Full Access | Admin xem được tất cả |
| BR-03 | Project Scope | Non-admin chỉ thấy trong dự án mình là member |
| BR-04 | Tasks Limit 20 | Tối đa 20 công việc |
| BR-05 | Others Limit 10 | Projects, Comments, Users tối đa 10 |
| BR-06 | Deduplicate Users | Non-admin: users trong dự án chung được deduplicate |
| BR-07 | Active Users Only | Chỉ tìm users có isActive = true |
| BR-08 | Active Projects | Chỉ tìm projects có isArchived = false |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/search/route.ts`
- [x] Confirmed: Tasks limit = 20, others = 10
- [x] Confirmed: Also searches Comments (4 types not 3)
- [x] Confirmed: Min query length = 2

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
