# Biểu đồ trình tự 06: Xem danh sách công việc (UC-22)

> **Use Case**: UC-22 - Xem danh sách công việc  
> **Module**: Quản lý công việc  
> **Mã nguồn**: `src/app/api/tasks/route.ts` (GET)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng |
| **Biên** | Trang danh sách, API |
| **Điều khiển** | Kiểm tra quyền, Xây dựng bộ lọc |
| **Thực thể** | Cơ sở dữ liệu (Task, Project) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Trang danh sách công việc, API /api/tasks
- **Điều khiển**: Lọc quyền, Xây dựng truy vấn
- **Thực thể**: Prisma (Task, Project, ProjectMember)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Xem danh sách công việc (UC-22)
footer Mã nguồn: src/app/api/tasks/route.ts

actor "Người dùng" as ND
boundary "Trang\\ndanh sách" as TDS #LightGreen
boundary "API" as API #LightBlue
control "Xây dựng\\nbộ lọc" as XD #Orange
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Truy cập trang danh sách ==
ND -> TDS: 1. Truy cập /tasks
activate TDS
TDS -> API: 1.1. GET /api/tasks?page=1&filters...
activate API

== 2. Xác định dự án được phép xem ==
API -> API: 1.1.1. Lấy thông tin phiên đăng nhập
API -> DB: 1.1.2. Lấy danh sách dự án có quyền xem
activate DB
note right of DB
    getAccessibleProjectIds()
    Quyền: tasks.view_project
end note
DB --> API: 1.1.3. Danh sách ID dự án
deactivate DB

alt Chỉ định dự án cụ thể
    API -> API: 1.1.4. Kiểm tra quyền truy cập dự án
    alt Không có quyền
        API --> TDS: 1.2. Lỗi 403: "Không có quyền xem dự án này"
        TDS --> ND: 2. Hiển thị lỗi
    end
end

== 3. Xây dựng bộ lọc ==
API -> XD: 1.1.5. Xây dựng điều kiện truy vấn
activate XD
XD -> XD: 1.1.5.1. Lọc dự án được phép
XD -> XD: 1.1.5.2. Lọc công việc riêng tư
note right of XD
    Non-admin chỉ xem:
    - isPrivate = false
    - HOẶC creatorId = mình
    - HOẶC assigneeId = mình
end note
XD -> XD: 1.1.5.3. Áp dụng bộ lọc từ query params
note right of XD
    Các bộ lọc:
    - statusId, priorityId
    - trackerId, assigneeId
    - versionId, parentId
    - search, isClosed
    - startDate, dueDate
end note
XD --> API: 1.1.6. Điều kiện WHERE hoàn chỉnh
deactivate XD

== 4. Thực hiện truy vấn song song ==
par Truy vấn song song
    API -> DB: 1.1.7. Lấy danh sách công việc
    activate DB
    note right of DB
        prisma.task.findMany({
            where, orderBy,
            skip, take,
            include: tracker, status,
            priority, project, assignee...
        })
    end note
    DB --> API: 1.1.8. Danh sách công việc
    deactivate DB
else Đếm tổng
    API -> DB: 1.1.9. Đếm tổng số công việc
    activate DB
    note right of DB
        prisma.task.count({ where })
    end note
    DB --> API: 1.1.10. Tổng số
    deactivate DB
else Tính tổng giờ
    API -> DB: 1.1.11. Tính tổng giờ ước tính
    activate DB
    note right of DB
        prisma.task.aggregate({
            _sum: { estimatedHours }
        })
    end note
    DB --> API: 1.1.12. Tổng giờ
    deactivate DB
end

== 5. Trả về kết quả ==
API --> TDS: 1.2. Thành công: { tasks, pagination, aggregations }
deactivate API
TDS -> TDS: 1.3. Render danh sách công việc
TDS --> ND: 2. Hiển thị danh sách với phân trang
deactivate TDS

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Số | Ý nghĩa |
|----|---------|
| 1, 2 | Giai đoạn: Truy vấn, Hiển thị |
| 1.1, 1.2, 1.3 | Các bước trong giai đoạn 1 |
| 1.1.1 - 1.1.12 | Chi tiết xử lý API |
| 1.1.5.1 - 1.1.5.3 | Chi tiết xây dựng bộ lọc |

---

## 5. Các bộ lọc hỗ trợ

| Bộ lọc | Mô tả |
|--------|-------|
| statusId | Trạng thái công việc |
| priorityId | Độ ưu tiên |
| trackerId | Loại công việc |
| assigneeId | Người thực hiện |
| creatorId | Người tạo |
| versionId | Phiên bản |
| parentId | Công việc cha |
| isClosed | Trạng thái đóng/mở |
| search | Tìm kiếm theo tiêu đề, mô tả |
| startDateFrom/To | Khoảng ngày bắt đầu |
| dueDateFrom/To | Khoảng ngày đến hạn |

---

## 6. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Quyền xem | Cần quyền `tasks.view_project` trong dự án |
| Công việc riêng tư | Non-admin chỉ xem của mình |
| Phân trang | Tối đa 100 công việc mỗi trang |
| Sắp xếp mặc định | Theo thời gian cập nhật giảm dần |

---

*Ngày tạo: 2026-01-16*
