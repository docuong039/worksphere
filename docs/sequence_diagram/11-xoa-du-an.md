# Biểu đồ trình tự 11: Xóa dự án (UC-12)

> **Use Case**: UC-12 - Xóa dự án  
> **Module**: Quản lý dự án  
> **Mã nguồn**: `src/app/api/projects/[id]/route.ts` (DELETE)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người tạo dự án hoặc Quản trị viên |
| **Biên** | Cài đặt dự án, API |
| **Điều khiển** | Kiểm tra quyền |
| **Thực thể** | Cơ sở dữ liệu (Project, Task, Comment, ...) |

---

## 2. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Xóa dự án (UC-12)
footer Mã nguồn: src/app/api/projects/[id]/route.ts

actor "Người dùng" as ND
boundary "Cài đặt\\ndự án" as CD #LightGreen
boundary "API" as API #LightBlue
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Yêu cầu xóa dự án ==
ND -> CD: 1. Nhấn nút "Xóa dự án"
activate CD
CD -> CD: 1.1. Hiển thị cảnh báo
note right of CD
    "Thao tác này không thể hoàn tác.
    Tất cả dữ liệu sẽ bị xóa vĩnh viễn."
end note
CD --> ND: 1.2. Yêu cầu xác nhận

== 2. Xác nhận và gửi yêu cầu ==
ND -> CD: 2. Xác nhận xóa
CD -> API: 2.1. DELETE /api/projects/{id}
activate API

== 3. Kiểm tra quyền ==
API -> API: 2.1.1. Lấy thông tin phiên đăng nhập
API -> DB: 2.1.2. Lấy thông tin dự án
activate DB
DB --> API: 2.1.3. Thông tin dự án (bao gồm creatorId)
deactivate DB

API -> API: 2.1.4. Kiểm tra quyền xóa
note right of API
    Được phép nếu:
    - isAdministrator = true
    - HOẶC creatorId = userId
end note

alt Không có quyền
    API --> CD: 2.2. Lỗi 403: "Không có quyền xóa dự án"
    CD --> ND: 3. Hiển thị lỗi
end

== 4. Xóa dữ liệu liên quan (Cascade) ==
API -> DB: 2.1.5. Xóa tất cả Comment của các Task
activate DB
note right of DB: Xóa bình luận trước
DB --> API: 2.1.6. Đã xóa
deactivate DB

API -> DB: 2.1.7. Xóa tất cả Attachment
activate DB
note right of DB: Xóa file đính kèm
DB --> API: 2.1.8. Đã xóa
deactivate DB

API -> DB: 2.1.9. Xóa tất cả Watcher
activate DB
note right of DB: Xóa danh sách theo dõi
DB --> API: 2.1.10. Đã xóa
deactivate DB

API -> DB: 2.1.11. Xóa tất cả Task
activate DB
note right of DB: Xóa công việc
DB --> API: 2.1.12. Đã xóa
deactivate DB

API -> DB: 2.1.13. Xóa tất cả ProjectMember
activate DB
note right of DB: Xóa thành viên
DB --> API: 2.1.14. Đã xóa
deactivate DB

API -> DB: 2.1.15. Xóa tất cả Version
activate DB
note right of DB: Xóa phiên bản
DB --> API: 2.1.16. Đã xóa
deactivate DB

API -> DB: 2.1.17. Xóa tất cả ProjectTracker
activate DB
note right of DB: Xóa cài đặt loại công việc
DB --> API: 2.1.18. Đã xóa
deactivate DB

== 5. Xóa dự án ==
API -> DB: 2.1.19. Xóa Project
activate DB
DB --> API: 2.1.20. Đã xóa
deactivate DB

== 6. Ghi nhật ký ==
API -> DB: 2.1.21. Ghi nhật ký xóa dự án
activate DB
DB --> API: 2.1.22. Đã ghi
deactivate DB

API --> CD: 2.2. Thành công: "Đã xóa dự án"
deactivate API
CD --> ND: 3. Chuyển về danh sách dự án
deactivate CD

@enduml
```

---

## 3. Thứ tự xóa dữ liệu

| Thứ tự | Bảng | Lý do |
|--------|------|-------|
| 1 | Comment | Phụ thuộc Task |
| 2 | Attachment | Phụ thuộc Task |
| 3 | Watcher | Phụ thuộc Task |
| 4 | Task | Phụ thuộc Project |
| 5 | ProjectMember | Phụ thuộc Project |
| 6 | Version | Phụ thuộc Project |
| 7 | ProjectTracker | Phụ thuộc Project |
| 8 | Project | Bảng chính |

---

## 4. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Quyền xóa | Chỉ Admin hoặc người tạo |
| Không hoàn tác | Xóa vĩnh viễn, không thể khôi phục |
| Xóa cascade | Xóa tất cả dữ liệu liên quan |

---

*Ngày tạo: 2026-01-16*
