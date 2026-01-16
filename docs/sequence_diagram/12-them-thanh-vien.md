# Biểu đồ trình tự 12: Thêm thành viên vào dự án (UC-14)

> **Use Case**: UC-14 - Thêm thành viên vào dự án  
> **Module**: Quản lý thành viên  
> **Mã nguồn**: `src/app/api/projects/[id]/members/route.ts` (POST)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người có quyền quản lý thành viên |
| **Biên** | Cài đặt dự án, API |
| **Điều khiển** | Kiểm tra quyền, Validation |
| **Thực thể** | Cơ sở dữ liệu (ProjectMember, User, Role) |

---

## 2. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Thêm thành viên (UC-14)
footer Mã nguồn: src/app/api/projects/[id]/members/route.ts

actor "Người dùng" as ND
boundary "Cài đặt\\ndự án" as CD #LightGreen
boundary "API" as API #LightBlue
control "Kiểm tra\\nquyền" as KTQ #Orange
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Mở form thêm thành viên ==
ND -> CD: 1. Nhấn "Thêm thành viên"
activate CD
CD -> DB: 1.1. Lấy danh sách người dùng
activate DB
DB --> CD: 1.2. Danh sách users
deactivate DB
CD -> DB: 1.3. Lấy danh sách vai trò
activate DB
DB --> CD: 1.4. Danh sách roles
deactivate DB
CD --> ND: 1.5. Hiển thị form

== 2. Chọn và gửi ==
ND -> CD: 2. Chọn người dùng và vai trò
ND -> CD: 2.1. Nhấn "Thêm"
CD -> API: 2.2. POST /api/projects/{id}/members
activate API

== 3. Kiểm tra quyền ==
API -> API: 2.2.1. Lấy thông tin phiên đăng nhập
API -> KTQ: 2.2.2. Kiểm tra quyền quản lý thành viên
activate KTQ
KTQ -> DB: 2.2.2.1. Truy vấn quyền trong dự án
activate DB
note right of DB
    Kiểm tra:
    - isAdministrator
    - HOẶC là creator
    - HOẶC có quyền projects.manage_members
end note
DB --> KTQ: 2.2.2.2. Kết quả kiểm tra
deactivate DB
KTQ --> API: 2.2.3. Kết quả
deactivate KTQ

alt Không có quyền
    API --> CD: 2.3. Lỗi 403: "Không có quyền quản lý thành viên"
    CD --> ND: 3. Hiển thị lỗi
end

== 4. Kiểm tra người dùng ==
API -> DB: 2.2.4. Kiểm tra user tồn tại
activate DB
DB --> API: 2.2.5. Thông tin user
deactivate DB

alt User không tồn tại
    API --> CD: 2.3. Lỗi 404: "Người dùng không tồn tại"
    CD --> ND: 3. Hiển thị lỗi
end

== 5. Kiểm tra vai trò ==
API -> DB: 2.2.6. Kiểm tra role tồn tại
activate DB
DB --> API: 2.2.7. Thông tin role
deactivate DB

alt Role không tồn tại
    API --> CD: 2.3. Lỗi 400: "Vai trò không tồn tại"
    CD --> ND: 3. Hiển thị lỗi
end

== 6. Kiểm tra đã là thành viên ==
API -> DB: 2.2.8. Kiểm tra user đã là member chưa
activate DB
DB --> API: 2.2.9. Kết quả
deactivate DB

alt Đã là thành viên
    API --> CD: 2.3. Lỗi 400: "Người dùng đã là thành viên"
    CD --> ND: 3. Hiển thị lỗi
end

== 7. Tạo thành viên ==
API -> DB: 2.2.10. Tạo ProjectMember
activate DB
note right of DB
    prisma.projectMember.create({
        data: {
            projectId,
            userId,
            roleId
        }
    })
end note
DB --> API: 2.2.11. Thông tin thành viên
deactivate DB

API --> CD: 2.3. Thành công: Thông tin member mới
deactivate API
CD -> CD: 2.4. Cập nhật danh sách thành viên
CD --> ND: 3. Hiển thị thông báo thành công
deactivate CD

@enduml
```

---

## 3. Các kiểm tra thực hiện

| Thứ tự | Kiểm tra | Lỗi nếu thất bại |
|--------|----------|------------------|
| 1 | Quyền quản lý | 403: Không có quyền |
| 2 | User tồn tại | 404: User không tồn tại |
| 3 | Role tồn tại | 400: Role không tồn tại |
| 4 | Chưa là member | 400: Đã là thành viên |

---

## 4. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Quyền cần thiết | Admin, Creator, hoặc có quyền manage_members |
| User hợp lệ | Phải là user tồn tại trong hệ thống |
| Role hợp lệ | Phải chọn role có sẵn |
| Không trùng | Mỗi user chỉ có một membership trong dự án |

---

*Ngày tạo: 2026-01-16*
