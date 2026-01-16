# Biểu đồ trình tự 04: Tạo người dùng mới (UC-05)

> **Use Case**: UC-05 - Tạo người dùng mới  
> **Module**: Quản lý người dùng  
> **Mã nguồn**: `src/app/api/users/route.ts` (POST)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Quản trị viên |
| **Biên** | Form người dùng, API |
| **Điều khiển** | Kiểm tra quyền, Validation, Hash mật khẩu |
| **Thực thể** | Cơ sở dữ liệu (User) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Quản trị viên
- **Biên**: Form người dùng, API /api/users
- **Điều khiển**: Zod, bcrypt
- **Thực thể**: Prisma (User)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Tạo người dùng mới (UC-05)
footer Mã nguồn: src/app/api/users/route.ts

actor "Quản trị viên" as QTV
boundary "Form\\nNgười dùng" as FRM #LightGreen
boundary "API" as API #LightBlue
control "Validation" as VAL #Yellow
control "bcrypt" as BC #Orange
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Mở form tạo người dùng ==
QTV -> FRM: 1. Nhấn "Thêm người dùng"
activate FRM
FRM -> FRM: 1.1. Hiển thị form
FRM --> QTV: 1.2. Hiển thị các trường nhập liệu

== 2. Gửi thông tin người dùng ==
QTV -> FRM: 2. Điền thông tin
note right of QTV
    - Tên
    - Email
    - Mật khẩu
    - Quyền admin (tùy chọn)
end note
QTV -> FRM: 2.1. Nhấn nút "Lưu"
FRM -> API: 2.2. POST /api/users
activate API

== 3. Kiểm tra quyền quản trị ==
API -> API: 2.2.1. Lấy thông tin phiên đăng nhập
API -> API: 2.2.2. Kiểm tra isAdministrator
alt Không phải quản trị viên
    API --> FRM: 2.3. Lỗi 403: "Không có quyền truy cập"
    FRM --> QTV: 3. Hiển thị lỗi quyền
end

== 4. Kiểm tra dữ liệu ==
API -> VAL: 2.2.3. Kiểm tra dữ liệu đầu vào
activate VAL
note right of VAL
    Kiểm tra:
    - email: định dạng hợp lệ
    - name: không rỗng
    - password: tối thiểu 6 ký tự
end note
alt Dữ liệu không hợp lệ
    VAL --> API: 2.2.4. Lỗi validation
    API --> FRM: 2.3. Lỗi 400: Chi tiết lỗi
    FRM --> QTV: 3. Hiển thị lỗi validation
end
VAL --> API: 2.2.4. Dữ liệu đã xác thực
deactivate VAL

== 5. Mã hóa mật khẩu ==
API -> BC: 2.2.5. Mã hóa mật khẩu với bcrypt
activate BC
note right of BC
    bcrypt.hash(password, 10)
    Salt rounds = 10
end note
BC --> API: 2.2.6. Mật khẩu đã mã hóa
deactivate BC

== 6. Tạo người dùng ==
API -> DB: 2.2.7. Tạo người dùng mới
activate DB
note right of DB
    prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            isAdministrator
        }
    })
end note

alt Email đã tồn tại
    DB --> API: 2.2.8. Lỗi ràng buộc unique
    API --> FRM: 2.3. Lỗi 400: "Email đã được sử dụng"
    FRM --> QTV: 3. Hiển thị lỗi trùng email
else Tạo thành công
    DB --> API: 2.2.8. Thông tin người dùng mới
    deactivate DB
    
    API --> FRM: 2.3. Thành công 201: Thông tin user
    note right of API
        Trả về:
        - id
        - email
        - name
        - isAdministrator
        - isActive
        - createdAt
    end note
    
    FRM -> FRM: 2.4. Cập nhật danh sách
    FRM --> QTV: 3. Hiển thị thông báo thành công
end

deactivate API
deactivate FRM

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Số | Ý nghĩa |
|----|---------|
| 1, 2, 3 | Giai đoạn chính |
| 2.1, 2.2, 2.3, 2.4 | Hành động trong giai đoạn 2 |
| 2.2.1 - 2.2.8 | Chi tiết xử lý API |

---

## 5. Xử lý lỗi

| Trường hợp | Mã lỗi | Thông báo |
|------------|--------|-----------|
| Không phải admin | 403 | "Không có quyền truy cập" |
| Dữ liệu không hợp lệ | 400 | Chi tiết từ Zod |
| Email đã tồn tại | 400 | "Email đã được sử dụng" |

---

## 6. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Chỉ Admin | Chỉ quản trị viên mới được tạo user |
| Email duy nhất | Email phải là duy nhất trong hệ thống |
| Mã hóa mật khẩu | Sử dụng bcrypt với 10 salt rounds |
| Mặc định hoạt động | isActive = true khi tạo mới |

---

*Ngày tạo: 2026-01-16*
