# Biểu đồ trình tự 01: Đăng nhập (UC-01)

> **Use Case**: UC-01 - Đăng nhập  
> **Module**: Xác thực  
> **Mã nguồn**: `src/lib/auth.ts`, `src/app/login/page.tsx`

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng (chưa đăng nhập) |
| **Biên** | Trang đăng nhập, NextAuth |
| **Điều khiển** | Xác thực thông tin đăng nhập |
| **Thực thể** | Cơ sở dữ liệu (bảng User) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Trang đăng nhập, NextAuth
- **Điều khiển**: Hàm authorize, bcrypt
- **Thực thể**: Prisma (User)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Đăng nhập (UC-01)
footer Mã nguồn: src/lib/auth.ts

actor "Người dùng" as ND
boundary "Trang\\nĐăng nhập" as TDN #LightGreen
boundary "NextAuth" as NA #LightBlue
control "Xác thực\\nCredentials" as XC #Orange
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Hiển thị trang đăng nhập ==
ND -> TDN: 1. Truy cập /login
activate TDN
TDN -> TDN: 1.1. Hiển thị form nhập liệu
TDN --> ND: 1.2. Hiển thị form (email, mật khẩu)

== 2. Gửi thông tin đăng nhập ==
ND -> TDN: 2. Nhập email và mật khẩu
ND -> TDN: 2.1. Nhấn nút "Đăng nhập"
TDN -> NA: 2.2. signIn("credentials", {email, password})
activate NA

NA -> XC: 2.2.1. Gọi hàm authorize()
activate XC

== 3. Kiểm tra dữ liệu đầu vào ==
XC -> XC: 2.2.1.1. Kiểm tra email và password có tồn tại
alt Thiếu email hoặc password
    XC --> NA: 2.2.2. Trả về null
    NA --> TDN: 2.3. Lỗi đăng nhập
    TDN --> ND: 3. "Email hoặc mật khẩu không đúng"
end

== 4. Tìm người dùng ==
XC -> DB: 2.2.1.2. Truy vấn user theo email
activate DB
note right of DB
    prisma.user.findUnique({
        where: { email }
    })
end note
DB --> XC: 2.2.1.3. Thông tin user hoặc null
deactivate DB

alt User không tồn tại hoặc bị khóa
    XC --> NA: 2.2.2. Trả về null
    NA --> TDN: 2.3. Lỗi đăng nhập
    TDN --> ND: 3. "Email hoặc mật khẩu không đúng"
    note right: Bảo mật: Không tiết lộ\\ntài khoản bị khóa
end

== 5. Xác minh mật khẩu ==
XC -> XC: 2.2.1.4. So sánh mật khẩu bằng bcrypt
note right of XC
    bcrypt.compare(
        password,
        user.password
    )
end note

alt Mật khẩu không khớp
    XC --> NA: 2.2.2. Trả về null
    NA --> TDN: 2.3. Lỗi đăng nhập
    TDN --> ND: 3. "Email hoặc mật khẩu không đúng"
end

== 6. Tạo phiên đăng nhập ==
XC --> NA: 2.2.2. Trả về {id, email, name, isAdministrator}
deactivate XC

NA -> NA: 2.2.3. Gọi jwt() callback
note right of NA
    Thêm vào token:
    - token.id = user.id
    - token.isAdministrator
end note

NA -> NA: 2.2.4. Gọi session() callback
note right of NA
    Thêm vào session:
    - session.user.id
    - session.user.isAdministrator
end note

NA -> NA: 2.2.5. Lưu cookie phiên đăng nhập
NA --> TDN: 2.3. Chuyển hướng đến trang chủ
deactivate NA

TDN --> ND: 3. Hiển thị Dashboard
deactivate TDN

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Cấp độ | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| 1, 2, 3 | Các giai đoạn chính | 1. Hiển thị trang, 2. Gửi form, 3. Kết quả |
| 2.1, 2.2 | Hành động con trong giai đoạn | 2.1. Nhấn nút, 2.2. Gọi API |
| 2.2.1, 2.2.2 | Chi tiết xử lý | 2.2.1. Gọi authorize, 2.2.2. Trả kết quả |
| 2.2.1.1, 2.2.1.2 | Xử lý sâu nhất | 2.2.1.1. Kiểm tra input, 2.2.1.2. Query DB |

---

## 5. Xử lý lỗi

| Trường hợp | Hành động | Thông báo |
|------------|-----------|-----------|
| Thiếu email/password | Trả về null | "Email hoặc mật khẩu không đúng" |
| User không tồn tại | Trả về null | "Email hoặc mật khẩu không đúng" |
| Tài khoản bị khóa | Trả về null | "Email hoặc mật khẩu không đúng" |
| Sai mật khẩu | Trả về null | "Email hoặc mật khẩu không đúng" |

> **Lưu ý bảo mật**: Tất cả lỗi đều trả về cùng thông báo để tránh kẻ tấn công đoán được email hợp lệ.

---

*Ngày tạo: 2026-01-16*
