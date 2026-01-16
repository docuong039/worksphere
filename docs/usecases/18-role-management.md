# Use Case Diagram 18: Quản lý Vai trò (Role Management)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: System Configuration - Roles & Permissions  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Role Management |
| **Mô tả** | Các chức năng quản lý vai trò và phân quyền |
| **Số Use Cases** | 4 |
| **Actors** | Administrator |
| **Source Files** | `src/app/api/roles/route.ts`, `src/app/api/roles/[id]/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-63 - Xem danh sách vai trò

---

#### 1. Mô tả
Xem tất cả vai trò trong hệ thống với danh sách quyền.

#### 2. Tác nhân chính
- **User**: Không yêu cầu quyền đặc biệt cho GET danh sách.

#### 3. Chuỗi sự kiện chính
1. Người dùng truy cập trang quản lý vai trò.
2. Hệ thống truy vấn danh sách vai trò với:
   - orderBy: name ASC
   - Include permissions với chi tiết permission
   - Include _count.projectMembers (số thành viên sử dụng)
3. Hiển thị danh sách vai trò.

---

### USE CASE: UC-64 - Tạo vai trò mới

---

#### 1. Mô tả
Thêm vai trò mới vào hệ thống.

#### 2. Tác nhân chính
- **Administrator**: Quản trị viên hệ thống.

#### 3. Tiền điều kiện
- Người dùng là Quản trị viên.

#### 4. Chuỗi sự kiện chính
1. Admin nhấn "Thêm vai trò".
2. Hệ thống hiển thị form với các trường:
   - name: Tên vai trò (bắt buộc)
   - description: Mô tả
   - canAssignToOther: có thể gán việc cho người khác
   - canBeAssigned: có thể được gán việc
3. Hệ thống validate dữ liệu với createRoleSchema.
4. Hệ thống tạo vai trò mới.
5. Hệ thống trả về role với permissions.
6. Hiển thị thông báo thành công.

#### 5. Luồng ngoại lệ

**E1: Không phải Admin**
- Hệ thống từ chối với mã lỗi 403.

---

### USE CASE: UC-65 - Cập nhật vai trò

---

#### 1. Mô tả
Chỉnh sửa vai trò và quyền.

#### 2. Tác nhân chính
- **Administrator**: Quản trị viên hệ thống.

#### 3. Tiền điều kiện
- Người dùng là Quản trị viên.

#### 4. Chuỗi sự kiện chính
1. Admin chọn vai trò cần sửa.
2. Hệ thống hiển thị form với thông tin hiện tại.
3. Admin chỉnh sửa thông tin.
4. Hệ thống validate với updateRoleSchema.
5. Hệ thống cập nhật role.
6. Hệ thống trả về role với permissions.
7. Hiển thị thông báo thành công.

#### 5. Ghi chú
- Thay đổi quyền ảnh hưởng ngay lập tức đến tất cả người dùng có vai trò này.
- canAssignToOther quyết định khả năng gán công việc cho người khác.

---

### USE CASE: UC-66 - Xóa vai trò

---

#### 1. Mô tả
Xóa vai trò khỏi hệ thống với cascade delete các liên kết.

#### 2. Tác nhân chính
- **Administrator**: Quản trị viên hệ thống.

#### 3. Tiền điều kiện
- Người dùng là Quản trị viên.
- Vai trò KHÔNG được sử dụng bởi bất kỳ thành viên nào.

#### 4. Đảm bảo tối thiểu
- Vai trò đang được sử dụng không thể bị xóa.

#### 5. Đảm bảo thành công
- Vai trò và các liên kết được xóa sạch.

#### 6. Chuỗi sự kiện chính
1. Admin chọn vai trò cần xóa.
2. Admin nhấn "Xóa".
3. Hệ thống hiển thị xác nhận.
4. Admin xác nhận xóa.
5. Hệ thống kiểm tra có projectMembers đang sử dụng:
   - Nếu có: từ chối xóa với lỗi chi tiết.
6. Hệ thống kiểm tra có WorkflowTransitions sử dụng:
   - Nếu có: XÓA tất cả workflow transitions của role này.
7. Hệ thống xóa tất cả RolePermissions của role này.
8. Hệ thống xóa role.
9. Hiển thị thông báo: "Đã xóa role".
10. Kết thúc Use Case.

#### 7. Luồng ngoại lệ

**E1: Vai trò đang được sử dụng**
- Rẽ nhánh từ bước 5.
- Hệ thống từ chối với mã lỗi 400.
- Hiển thị: "Không thể xóa role đang được sử dụng bởi X thành viên".
- Kết thúc Use Case.

**E2: Vai trò không tồn tại**
- Hệ thống từ chối với mã lỗi 404.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Admin Only Mutate | Chỉ admin được tạo/sửa/xóa vai trò |
| BR-02 | No Delete Used | Không xóa vai trò đang được sử dụng bởi thành viên |
| BR-03 | Cascade Workflow | Khi xóa role, WorkflowTransitions của role bị xóa theo |
| BR-04 | Cascade Permissions | Khi xóa role, RolePermissions bị xóa theo |
| BR-05 | canAssignToOther | Kiểm tra tường minh (= true) khi gán công việc |
| BR-06 | canBeAssigned | Quyết định user có thể được gán công việc |
| BR-07 | Immediate Effect | Thay đổi quyền có hiệu lực ngay lập tức |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/roles/route.ts`
- [x] Đã đối chiếu với `src/app/api/roles/[id]/route.ts` (121 dòng)
- [x] Confirmed: memberCount check trước delete (Line 83-92)
- [x] Confirmed: Cascade delete WorkflowTransitions (Line 95-104)
- [x] Confirmed: Cascade delete RolePermissions (Line 107-109)

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
