# Biểu đồ trình tự 02: Tạo dự án mới (UC-10)

> **Use Case**: UC-10 - Tạo dự án mới  
> **Module**: Quản lý dự án  
> **Mã nguồn**: `src/app/api/projects/route.ts` (POST)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng (có quyền tạo dự án) |
| **Biên** | Form tạo dự án, API |
| **Điều khiển** | Kiểm tra quyền, Validation |
| **Thực thể** | Cơ sở dữ liệu (Project, Role, Tracker) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Form dự án, API /api/projects
- **Điều khiển**: Kiểm tra quyền, Zod validation
- **Thực thể**: Prisma (Project, ProjectMember, Role, Tracker)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Tạo dự án mới (UC-10)
footer Mã nguồn: src/app/api/projects/route.ts

actor "Người dùng" as ND
boundary "Form\\nDự án" as FRM #LightGreen
boundary "API" as API #LightBlue
control "Kiểm tra\\nquyền" as KTQ #Orange
control "Validation" as VAL #Yellow
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Mở form tạo dự án ==
ND -> FRM: 1. Nhấn "Tạo dự án mới"
activate FRM
FRM -> FRM: 1.1. Hiển thị form
FRM --> ND: 1.2. Hiển thị các trường nhập liệu

== 2. Gửi thông tin dự án ==
ND -> FRM: 2. Điền thông tin dự án
note right of ND
    - Tên dự án
    - Mã định danh
    - Mô tả
    - Ngày bắt đầu/kết thúc
end note
ND -> FRM: 2.1. Nhấn nút "Tạo"
FRM -> API: 2.2. POST /api/projects
activate API

== 3. Kiểm tra đăng nhập ==
API -> API: 2.2.1. Lấy thông tin phiên đăng nhập
alt Chưa đăng nhập
    API --> FRM: 2.3. Lỗi 401: "Chưa đăng nhập"
    FRM --> ND: 3. Chuyển đến trang đăng nhập
end

== 4. Kiểm tra quyền ==
API -> KTQ: 2.2.2. Kiểm tra quyền tạo dự án
activate KTQ
alt Không phải Admin
    KTQ -> DB: 2.2.2.1. Truy vấn vai trò và quyền
    activate DB
    DB --> KTQ: 2.2.2.2. Danh sách quyền
    deactivate DB
end
KTQ --> API: 2.2.3. Kết quả kiểm tra quyền
deactivate KTQ

alt Không có quyền
    API --> FRM: 2.3. Lỗi 403: "Không có quyền tạo dự án"
    FRM --> ND: 3. Hiển thị thông báo lỗi
end

== 5. Kiểm tra dữ liệu ==
API -> VAL: 2.2.4. Kiểm tra dữ liệu đầu vào
activate VAL
alt Dữ liệu không hợp lệ
    VAL --> API: 2.2.5. Lỗi validation
    API --> FRM: 2.3. Lỗi 400: Chi tiết lỗi
    FRM --> ND: 3. Hiển thị lỗi validation
end
VAL --> API: 2.2.5. Dữ liệu đã được xác thực
deactivate VAL

== 6. Kiểm tra mã định danh ==
API -> DB: 2.2.6. Kiểm tra mã định danh đã tồn tại
activate DB
DB --> API: 2.2.7. Kết quả kiểm tra
deactivate DB

alt Mã định danh đã tồn tại
    API --> FRM: 2.3. Lỗi 400: "Mã định danh đã tồn tại"
    FRM --> ND: 3. Hiển thị thông báo lỗi
end

== 7. Lấy vai trò Quản lý ==
API -> DB: 2.2.8. Tìm vai trò "Manager"
activate DB
DB --> API: 2.2.9. Thông tin vai trò
deactivate DB

== 8. Tạo dự án ==
API -> DB: 2.2.10. Tạo dự án và thêm người tạo làm Quản lý
activate DB
note right of DB
    Giao dịch:
    1. Tạo Project
    2. Tạo ProjectMember
       (người tạo = Quản lý)
end note
DB --> API: 2.2.11. Thông tin dự án mới
deactivate DB

== 9. Kích hoạt loại công việc ==
API -> DB: 2.2.12. Lấy danh sách tất cả Tracker
activate DB
DB --> API: 2.2.13. Danh sách Tracker
deactivate DB

API -> DB: 2.2.14. Kích hoạt tất cả Tracker cho dự án
activate DB
DB --> API: 2.2.15. Đã kích hoạt
deactivate DB

== 10. Ghi nhật ký ==
API -> DB: 2.2.16. Ghi nhật ký tạo dự án
activate DB
DB --> API: 2.2.17. Đã ghi
deactivate DB

API --> FRM: 2.3. Thành công 201: Thông tin dự án
deactivate API
FRM --> ND: 3. Chuyển đến trang chi tiết dự án
deactivate FRM

@enduml
```

---

## 4. Giải thích quy tắc đánh số

- **1, 2, 3**: Các giai đoạn chính (Mở form, Gửi, Kết quả)
- **2.1, 2.2, 2.3**: Các hành động trong giai đoạn 2
- **2.2.1 - 2.2.17**: Chi tiết xử lý trong API
- **2.2.2.1, 2.2.2.2**: Xử lý lồng sâu (query DB trong kiểm tra quyền)

---

## 5. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Người tạo là Quản lý | Người tạo dự án tự động được gán vai trò Manager |
| Kích hoạt Tracker | Tất cả loại công việc được kích hoạt mặc định |
| Mã định danh duy nhất | Identifier phải là duy nhất trong hệ thống |
| Ghi nhật ký | Mọi thao tác tạo dự án đều được ghi log |

---

*Ngày tạo: 2026-01-16*
