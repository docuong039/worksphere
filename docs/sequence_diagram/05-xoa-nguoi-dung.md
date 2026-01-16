# Biểu đồ trình tự 05: Xóa người dùng (UC-07)

> **Use Case**: UC-07 - Xóa người dùng  
> **Module**: Quản lý người dùng  
> **Mã nguồn**: `src/app/api/users/[id]/route.ts` (DELETE)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Quản trị viên |
| **Biên** | Danh sách người dùng, API |
| **Điều khiển** | Kiểm tra ràng buộc |
| **Thực thể** | Cơ sở dữ liệu (User, Task, ProjectMember) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Quản trị viên
- **Biên**: Trang quản lý, API /api/users/[id]
- **Điều khiển**: Kiểm tra ràng buộc
- **Thực thể**: Prisma (User, Task, ProjectMember, Watcher, Notification)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Xóa người dùng (UC-07)
footer Mã nguồn: src/app/api/users/[id]/route.ts

actor "Quản trị viên" as QTV
boundary "Trang\\nquản lý" as TQ #LightGreen
boundary "API" as API #LightBlue
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Chọn người dùng cần xóa ==
QTV -> TQ: 1. Nhấn nút "Xóa" của user
activate TQ
TQ -> TQ: 1.1. Hiển thị hộp thoại xác nhận
TQ --> QTV: 1.2. "Bạn có chắc muốn xóa?"

== 2. Xác nhận và gửi yêu cầu ==
QTV -> TQ: 2. Nhấn "Xác nhận"
TQ -> API: 2.1. DELETE /api/users/{id}
activate API

== 3. Kiểm tra quyền ==
API -> API: 2.1.1. Lấy thông tin phiên đăng nhập
API -> API: 2.1.2. Kiểm tra isAdministrator
alt Không phải quản trị viên
    API --> TQ: 2.2. Lỗi 403: "Không có quyền truy cập"
    TQ --> QTV: 3. Hiển thị lỗi quyền
end

== 4. Kiểm tra không tự xóa mình ==
API -> API: 2.1.3. So sánh session.user.id với id cần xóa
alt Đang tự xóa mình
    API --> TQ: 2.2. Lỗi 400: "Không thể tự xóa tài khoản của mình"
    TQ --> QTV: 3. Hiển thị lỗi
end

== 5. Kiểm tra công việc được gán ==
API -> DB: 2.1.4. Đếm số công việc được gán cho user
activate DB
note right of DB
    prisma.task.count({
        where: { assigneeId: id }
    })
end note
DB --> API: 2.1.5. Số lượng công việc
deactivate DB

alt User đang có công việc được gán
    API --> TQ: 2.2. Lỗi 400: "Không thể xóa user đang được gán X công việc"
    TQ --> QTV: 3. Hiển thị lỗi ràng buộc
end

== 6. Xóa dữ liệu liên quan ==
API -> DB: 2.1.6. Xóa tư cách thành viên dự án
activate DB
note right of DB
    prisma.projectMember.deleteMany({
        where: { userId: id }
    })
end note
DB --> API: 2.1.7. Đã xóa
deactivate DB

API -> DB: 2.1.8. Xóa danh sách theo dõi công việc
activate DB
note right of DB
    prisma.watcher.deleteMany({
        where: { userId: id }
    })
end note
DB --> API: 2.1.9. Đã xóa
deactivate DB

API -> DB: 2.1.10. Xóa thông báo
activate DB
note right of DB
    prisma.notification.deleteMany({
        where: { userId: id }
    })
end note
DB --> API: 2.1.11. Đã xóa
deactivate DB

== 7. Xóa người dùng ==
API -> DB: 2.1.12. Xóa người dùng
activate DB
note right of DB
    prisma.user.delete({
        where: { id }
    })
end note
DB --> API: 2.1.13. Đã xóa
deactivate DB

API --> TQ: 2.2. Thành công: "Đã xóa user"
deactivate API
TQ -> TQ: 2.3. Cập nhật danh sách
TQ --> QTV: 3. Hiển thị thông báo thành công
deactivate TQ

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Số | Ý nghĩa |
|----|---------|
| 1, 2, 3 | Giai đoạn: Chọn, Xử lý, Kết quả |
| 2.1, 2.2, 2.3 | Hành động trong giai đoạn 2 |
| 2.1.1 - 2.1.13 | Chi tiết xử lý API từng bước |

---

## 5. Các ràng buộc kiểm tra

| Kiểm tra | Mã lỗi | Thông báo |
|----------|--------|-----------|
| Không phải Admin | 403 | "Không có quyền truy cập" |
| Tự xóa mình | 400 | "Không thể tự xóa tài khoản của mình" |
| Có công việc được gán | 400 | "Không thể xóa user đang được gán X công việc" |

---

## 6. Thứ tự xóa dữ liệu (Cascade)

| Thứ tự | Bảng | Mô tả |
|--------|------|-------|
| 1 | ProjectMember | Xóa tư cách thành viên |
| 2 | Watcher | Xóa danh sách theo dõi |
| 3 | Notification | Xóa thông báo |
| 4 | User | Xóa người dùng |

---

*Ngày tạo: 2026-01-16*
