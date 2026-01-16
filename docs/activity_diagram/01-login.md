# Activity Diagram 01: Đăng nhập (UC-01)

> **Use Case**: UC-01 - Đăng nhập  
> **Module**: Authentication  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |
| **Số Decision nodes** | 4 |
| **Use Case tham chiếu** | [UC-01](../usecases/01-authentication.md) |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Đăng nhập (UC-01)

|User|
start
:Truy cập trang /login;
:Nhập Email và Password;
:Click "Đăng nhập";

|System|
:Validate input format;

if (Email format hợp lệ?) then (Không)
  :Hiển thị lỗi "Email không hợp lệ";
  |User|
  stop
endif

|Database|
:Query User by email;
note right
  SELECT * FROM User 
  WHERE email = ?
end note

|System|
if (User tồn tại VÀ isActive?) then (Không)
  :Hiển thị lỗi "Email hoặc mật khẩu không đúng";
  note right
    **Security**: Check !user || !user.isActive
    Không tiết lộ user có tồn tại hay bị khóa
  end note
  |User|
  stop
endif

:So sánh password với hash (bcrypt.compare);

if (Password đúng?) then (Không)
  :Hiển thị lỗi "Email hoặc mật khẩu không đúng";
  note right: **Security**: Lỗi chung chung
  |User|
  stop
endif

:Tạo JWT Session;
note right
  token.id = user.id
  token.isAdministrator = user.isAdministrator
end note
:Lưu session vào cookie;

|User|
:Redirect đến Dashboard (/);
:Hiển thị Dashboard;

stop

@enduml
```

---

## 3. Mô tả các bước (Khớp với UC-01 Main Flow)

| # UC | # AD | Actor | Hành động | Ghi chú |
|------|------|-------|-----------|---------| 
| 1 | 1 | User | Truy cập trang đăng nhập | /login |
| 2 | - | System | Hiển thị form | (implicit) |
| 3-4 | 2 | User | Nhập email & password | Required fields |
| 5 | 3 | User | Click Đăng nhập | Submit form |
| 6 | 4-5 | System/DB | Check user tồn tại AND isActive | Query + check |
| 7 | 6 | System | Xác minh password | bcrypt.compare() |
| 8 | 7-8 | System | Tạo phiên đăng nhập | JWT session |
| 9 | 9 | User | Chuyển đến Dashboard | Redirect |

---

## 4. Decision Points (Khớp với UC Exception Flows)

| # | Condition | True | False | UC Ref |
|---|-----------|------|-------|--------|
| D1 | Email format hợp lệ? | Tiếp tục | Lỗi, dừng | - |
| D2 | User tồn tại VÀ isActive? | Tiếp tục | Lỗi chung, dừng | E1 + E3 |
| D3 | Password đúng? | Tạo session | Lỗi chung, dừng | E2 |

---

## 5. Exception Handling (Khớp với UC)

| Exception | Xử lý | UC Ref |
|-----------|-------|--------|
| Email không tồn tại | Hiển thị lỗi **chung** (security) | E1 |
| Account bị khóa (isActive=false) | Hiển thị lỗi **chung** (security) | E3 |
| Password sai | Hiển thị lỗi **chung** (security) | E2 |
| Database error | Hiển thị lỗi server | E4 |

**Lưu ý quan trọng**: 
- Code check `!user || !user.isActive` CÙNG LÚC (Line 23 auth.ts)
- Password chỉ được verify SAU khi user tồn tại và active
- Tất cả lỗi xác thực đều hiển thị thông báo **chung** "Email hoặc mật khẩu không đúng"

---

*Cập nhật: 2026-01-16 - Đồng bộ với UC-01*
