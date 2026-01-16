# Activity Diagram: UC-05 - Tạo người dùng mới

> **Module**: User Management  
> **Use Case ID**: UC-05  
> **Tên Use Case**: Tạo người dùng mới  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép Administrator tạo tài khoản người dùng mới trong hệ thống

### 1.2. Actors
- **Administrator**: Quản trị viên hệ thống
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: User mới được tạo với mật khẩu đã hash
- **Failure**: Trả về lỗi validation hoặc email trùng

### 1.4. Các bước chính
1. Admin nhấn "Thêm người dùng"
2. System hiển thị form
3. Admin nhập thông tin
4. System validate và hash password
5. System tạo user trong database
6. Trả về kết quả

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-05: Tạo người dùng mới

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|Administrator|
start
:Truy cập trang quản lý người dùng;
:Nhấn nút "Thêm người dùng";

|System|
:Hiển thị form tạo người dùng;
note right
  Các trường:
  - Tên (bắt buộc)
  - Email (bắt buộc)
  - Mật khẩu (bắt buộc)
  - Quyền admin (tùy chọn)
end note

|Administrator|
:Nhập tên người dùng;
:Nhập địa chỉ email;
:Nhập mật khẩu;
:Chọn quyền quản trị (nếu cần);
:Nhấn nút "Lưu";

|System|
:Kiểm tra quyền quản trị của requester;
note right
  session.user.isAdministrator
  Line 75, route.ts
end note

if (Là Administrator?) then (yes)
  :Parse và validate dữ liệu 
  bằng createUserSchema;
  note right
    Zod validation
    src/lib/validations.ts
  end note
  
  if (Dữ liệu hợp lệ?) then (yes)
    :Hash mật khẩu bằng bcrypt
    với salt rounds = 10;
    note right
      bcrypt.hash(password, 10)
      Line 83, route.ts
    end note
    
    :Tạo user mới trong database;
    note right
      prisma.user.create()
      Line 85-100, route.ts
    end note
    
    if (Tạo thành công?) then (yes)
      :Trả về response 201 
      với thông tin user đã tạo;
      
      |Administrator|
      :Hiển thị thông báo thành công;
      :Cập nhật danh sách người dùng;
    else (no)
      |System|
      :Trả về lỗi: 
      "Email đã được sử dụng";
      note right
        Prisma unique constraint
        violation
      end note
      
      |Administrator|
      :Hiển thị thông báo lỗi;
    endif
  else (no)
    :Trả về lỗi validation;
    note right
      - Thiếu trường bắt buộc
      - Email không hợp lệ
      - Mật khẩu quá ngắn
    end note
    
    |Administrator|
    :Hiển thị các lỗi validation;
  endif
else (no)
  :Trả về lỗi 403:
  "Không có quyền truy cập";
  
  |Administrator|
  :Hiển thị thông báo từ chối;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/users/route.ts` | `POST()` | 71-106 | API tạo user mới |
| `src/lib/validations.ts` | `createUserSchema` | - | Schema validation |
| `bcryptjs` | `hash()` | 83 | Hash mật khẩu |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Admin Only | Chỉ admin mới được tạo user |
| BR-02 | Unique Email | Email phải unique trong hệ thống |
| BR-03 | Password Hash | Mật khẩu phải được hash trước khi lưu |
| BR-04 | Min Password | Mật khẩu tối thiểu 6 ký tự |
| BR-05 | Active Default | User mới mặc định isActive = true |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Tất cả if-else đều có endif
- [x] Các nhánh error merge về luồng chính
- [x] Swimlanes phân chia rõ Admin/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
