# Biểu đồ trình tự 10: Xem Dashboard (UC-49)

> **Use Case**: UC-49 - Xem Dashboard  
> **Module**: Dashboard  
> **Mã nguồn**: `src/app/api/dashboard/route.ts`

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng đã đăng nhập |
| **Biên** | Trang Dashboard, API |
| **Điều khiển** | Tổng hợp dữ liệu |
| **Thực thể** | Cơ sở dữ liệu (Task, Project, Activity) |

---

## 2. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Xem Dashboard (UC-49)
footer Mã nguồn: src/app/api/dashboard/route.ts

actor "Người dùng" as ND
boundary "Trang\\nDashboard" as TD #LightGreen
boundary "API" as API #LightBlue
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Truy cập Dashboard ==
ND -> TD: 1. Truy cập /dashboard
activate TD
TD -> API: 1.1. GET /api/dashboard
activate API

== 2. Xác thực ==
API -> API: 1.1.1. Lấy thông tin phiên đăng nhập
alt Chưa đăng nhập
    API --> TD: 1.2. Lỗi 401
    TD --> ND: 2. Chuyển đến trang đăng nhập
end

== 3. Truy vấn dữ liệu song song ==
par Đếm công việc được gán
    API -> DB: 1.1.2. Đếm công việc của tôi
    activate DB
    note right of DB
        Điều kiện:
        - assigneeId = userId
        - status.isClosed = false
    end note
    DB --> API: 1.1.3. Số công việc
    deactivate DB
else Đếm công việc quá hạn
    API -> DB: 1.1.4. Đếm công việc quá hạn
    activate DB
    note right of DB
        Điều kiện:
        - assigneeId = userId
        - dueDate < today
        - status.isClosed = false
    end note
    DB --> API: 1.1.5. Số quá hạn
    deactivate DB
else Đếm công việc sắp đến hạn
    API -> DB: 1.1.6. Đếm công việc sắp đến hạn
    activate DB
    note right of DB
        Điều kiện:
        - assigneeId = userId
        - dueDate <= today + 7 ngày
        - status.isClosed = false
    end note
    DB --> API: 1.1.7. Số sắp đến hạn
    deactivate DB
else Lấy hoạt động gần đây
    API -> DB: 1.1.8. Truy vấn hoạt động
    activate DB
    note right of DB
        Giới hạn: 10 hoạt động
        Sắp xếp: mới nhất
    end note
    DB --> API: 1.1.9. Danh sách hoạt động
    deactivate DB
else Thống kê theo trạng thái
    API -> DB: 1.1.10. Nhóm công việc theo trạng thái
    activate DB
    DB --> API: 1.1.11. Thống kê status
    deactivate DB
else Lấy danh sách dự án
    API -> DB: 1.1.12. Truy vấn dự án tham gia
    activate DB
    DB --> API: 1.1.13. Danh sách dự án
    deactivate DB
end

== 4. Trả về kết quả ==
API -> API: 1.1.14. Tổng hợp dữ liệu
API --> TD: 1.2. Thành công: Dashboard data
deactivate API

== 5. Hiển thị Dashboard ==
TD -> TD: 1.3. Render các widget
TD --> ND: 2. Hiển thị Dashboard hoàn chỉnh
note right of TD
    Các widget:
    - Công việc của tôi
    - Quá hạn
    - Sắp đến hạn
    - Biểu đồ trạng thái
    - Hoạt động gần đây
    - Danh sách dự án
end note
deactivate TD

@enduml
```

---

## 3. Giải thích

### Các widget hiển thị:
| Widget | Dữ liệu |
|--------|---------|
| Công việc của tôi | Số công việc đang mở được gán cho mình |
| Quá hạn | Số công việc đã quá ngày đến hạn |
| Sắp đến hạn | Số công việc đến hạn trong 7 ngày |
| Biểu đồ trạng thái | Thống kê theo nhóm status |
| Hoạt động gần đây | 10 hoạt động mới nhất |
| Dự án | Danh sách dự án đang tham gia |

---

*Ngày tạo: 2026-01-16*
