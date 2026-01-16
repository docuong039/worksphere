# Use Case Diagram 24: Profile cá nhân (User Profile)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: User Profile  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - User Profile |
| **Mô tả** | Các chức năng quản lý thông tin cá nhân |
| **Số Use Cases** | 2 |
| **Actors** | User |
| **Source Files** | `src/app/api/users/[id]/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-75 - Xem thông tin cá nhân

---

#### 1. Mô tả
Người dùng xem thông tin tài khoản của mình hoặc Admin xem thông tin của người khác.

#### 2. Tác nhân chính
- **User**: Xem profile của chính mình.
- **Administrator**: Xem profile của bất kỳ ai.

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.
- Nếu xem người khác: phải là Admin.

#### 4. Đảm bảo tối thiểu (Minimal Guarantee)
- Non-admin chỉ xem được profile của chính mình.

#### 5. Đảm bảo thành công (Success Guarantee)
- Thông tin profile được hiển thị đầy đủ.

#### 6. Chuỗi sự kiện chính (Main Flow)
1. Người dùng truy cập trang Profile.
2. Hệ thống kiểm tra quyền:
   - Nếu xem id = userId hiện tại: cho phép (self).
   - Nếu xem id khác và là Admin: cho phép.
   - Ngược lại: từ chối.
3. Hệ thống truy vấn thông tin user bao gồm:
   - Thông tin cơ bản: id, email, name, avatar
   - Trạng thái: isAdministrator, isActive
   - Thời gian tạo: createdAt
   - Danh sách dự án tham gia (projectMemberships) với:
     - Thông tin project: id, name, identifier
     - Vai trò: id, name
   - Thống kê (_count):
     - assignedTasks: số công việc được gán
     - createdTasks: số công việc đã tạo
4. Hệ thống hiển thị thông tin profile.
5. Kết thúc Use Case.

#### 7. Luồng ngoại lệ (Exception Flow)

**E1: Không có quyền**
- Rẽ nhánh từ bước 2.
- Hệ thống từ chối với mã lỗi 403.
- Thông báo: "Không có quyền truy cập".

**E2: User không tồn tại**
- Rẽ nhánh từ bước 3.
- Hệ thống trả về mã lỗi 404.
- Thông báo: "User không tồn tại".

---

### USE CASE: UC-76 - Cập nhật thông tin cá nhân

---

#### 1. Mô tả
Người dùng chỉnh sửa thông tin cá nhân của mình. Admin có thể sửa thêm các trường đặc biệt.

#### 2. Tác nhân chính
- **User**: Sửa profile của chính mình (hạn chế).
- **Administrator**: Sửa bất kỳ profile nào (đầy đủ).

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.
- Nếu sửa người khác: phải là Admin.

#### 4. Đảm bảo tối thiểu (Minimal Guarantee)
- Non-admin KHÔNG thể sửa isAdministrator và isActive.    

#### 5. Đảm bảo thành công (Success Guarantee)
- Thông tin được cập nhật trong database.
- Password được hash trước khi lưu (nếu thay đổi).

#### 6. Chuỗi sự kiện chính (Main Flow)
1. Người dùng mở form chỉnh sửa profile.
2. Hệ thống kiểm tra quyền:
   - isSelf = (userId param == session.user.id)
   - isAdmin = session.user.isAdministrator
   - Cho phép nếu isSelf hoặc isAdmin.
3. Hệ thống hiển thị form với thông tin hiện tại.
4. Người dùng thay đổi thông tin:
   - **Tất cả**: name, email, avatar, password
   - **Admin only**: isAdministrator, isActive
5. Người dùng nhấn "Lưu".
6. Nếu là non-admin sửa profile mình:
   - Hệ thống XÓA các trường isAdministrator, isActive khỏi data (bảo vệ).
7. Nếu có password mới:
   - Hệ thống hash password với bcrypt (salt = 10).
8. Hệ thống cập nhật user trong database.
9. Hệ thống trả về thông tin đã cập nhật.
10. Hiển thị thông báo thành công.
11. Kết thúc Use Case.

#### 7. Luồng ngoại lệ (Exception Flow)

**E1: Không có quyền**
- Rẽ nhánh từ bước 2.
- Hệ thống từ chối với mã lỗi 403.

**E2: Validation thất bại**
- Rẽ nhánh từ bước 5.
- Hệ thống hiển thị lỗi validation.
- Quay lại bước 3.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Self or Admin | Chỉ xem/sửa profile của mình hoặc là admin |
| BR-02 | Protected Fields | Non-admin không sửa được isAdministrator, isActive |
| BR-03 | Hash Password | Password luôn được hash với bcrypt salt 10 |
| BR-04 | Include Stats | Profile bao gồm số công việc được gán và đã tạo |
| BR-05 | Include Projects | Hiển thị danh sách dự án đang tham gia với vai trò |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/users/[id]/route.ts`
- [x] Confirmed: GET trả về projectMemberships và _count
- [x] Confirmed: PUT loại bỏ isAdministrator, isActive cho non-admin
- [x] Confirmed: Password hash với bcrypt 10 rounds

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
