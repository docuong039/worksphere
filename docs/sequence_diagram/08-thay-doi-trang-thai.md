# Biểu đồ trình tự 08: Thay đổi trạng thái công việc (UC-26)

> **Use Case**: UC-26 - Thay đổi trạng thái  
> **Module**: Quản lý công việc  
> **Mã nguồn**: `src/app/api/tasks/[id]/route.ts` (PUT)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng (có quyền chỉnh sửa) |
| **Biên** | Chi tiết công việc, API |
| **Điều khiển** | Kiểm tra workflow, Cập nhật |
| **Thực thể** | Cơ sở dữ liệu (Task, WorkflowTransition, Status) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Dropdown trạng thái, API
- **Điều khiển**: Kiểm tra workflow, Thông báo
- **Thực thể**: Prisma (Task, WorkflowTransition, Status)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Thay đổi trạng thái (UC-26)
footer Mã nguồn: src/app/api/tasks/[id]/route.ts

actor "Người dùng" as ND
boundary "Chi tiết\\ncông việc" as CT #LightGreen
boundary "API" as API #LightBlue
control "Kiểm tra\\nworkflow" as KT #Orange
control "Thông báo" as TB #Pink
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Chọn trạng thái mới ==
ND -> CT: 1. Mở dropdown trạng thái
activate CT
CT -> CT: 1.1. Hiển thị danh sách trạng thái
ND -> CT: 1.2. Chọn trạng thái mới
CT -> API: 1.3. PUT /api/tasks/{id} { statusId: newStatusId }
activate API

== 2. Kiểm tra quyền chỉnh sửa ==
API -> API: 1.3.1. Lấy thông tin phiên đăng nhập
API -> DB: 1.3.2. Lấy thông tin công việc hiện tại
activate DB
DB --> API: 1.3.3. Thông tin công việc
deactivate DB

API -> API: 1.3.4. Kiểm tra quyền chỉnh sửa
note right of API
    Quyền theo thứ tự:
    1. isAdministrator
    2. tasks.edit_any
    3. creatorId = mình + tasks.edit_own
    4. assigneeId = mình + tasks.edit_assigned
end note

alt Không có quyền
    API --> CT: 1.4. Lỗi 403: "Không có quyền sửa công việc"
    CT --> ND: 2. Hiển thị lỗi
end

== 3. Kiểm tra workflow ==
API -> KT: 1.3.5. Kiểm tra chuyển đổi trạng thái
activate KT

alt Là quản trị viên
    KT -> KT: 1.3.5.1. Bỏ qua kiểm tra workflow
else Người dùng thường
    KT -> DB: 1.3.5.1. Truy vấn WorkflowTransition
    activate DB
    note right of DB
        Điều kiện:
        - trackerId = công việc
        - fromStatusId = trạng thái hiện tại
        - toStatusId = trạng thái mới
        - roleId = null HOẶC = vai trò user
    end note
    DB --> KT: 1.3.5.2. Kết quả kiểm tra
    deactivate DB
    
    alt Không được phép chuyển
        KT --> API: 1.3.6. Không được phép
        API --> CT: 1.4. Lỗi 403: "Không được phép chuyển sang trạng thái này"
        CT --> ND: 2. Hiển thị lỗi workflow
    end
end
KT --> API: 1.3.6. Được phép chuyển
deactivate KT

== 4. Lấy thông tin trạng thái mới ==
API -> DB: 1.3.7. Lấy thông tin Status mới
activate DB
DB --> API: 1.3.8. Status { isClosed, defaultDoneRatio }
deactivate DB

== 5. Tính toán doneRatio tự động ==
API -> API: 1.3.9. Điều chỉnh doneRatio
note right of API
    Nếu status.isClosed = true:
        doneRatio = 100
    Nếu từ đóng sang mở:
        doneRatio = defaultDoneRatio hoặc 0
    Ngược lại: giữ nguyên
end note

== 6. Cập nhật công việc ==
API -> DB: 1.3.10. Cập nhật công việc
activate DB
note right of DB
    prisma.task.update({
        data: {
            statusId,
            doneRatio,
            lockVersion: { increment: 1 }
        }
    })
end note
DB --> API: 1.3.11. Công việc đã cập nhật
deactivate DB

== 7. Xử lý sau cập nhật ==
API -> TB: 1.3.12. Gửi thông báo thay đổi trạng thái
activate TB
TB -> DB: 1.3.12.1. Lấy danh sách watchers
activate DB
DB --> TB: 1.3.12.2. Danh sách người theo dõi
deactivate DB
TB -> DB: 1.3.12.3. Tạo thông báo
activate DB
DB --> TB: 1.3.12.4. Đã tạo
deactivate DB
TB --> API: 1.3.13. Đã thông báo
deactivate TB

opt Có công việc cha
    API -> DB: 1.3.14. Cập nhật thuộc tính công việc cha
    activate DB
    note right: Tính toán lại tiến độ tổng hợp
    DB --> API: 1.3.15. Đã cập nhật
    deactivate DB
end

API -> DB: 1.3.16. Ghi nhật ký thay đổi
activate DB
DB --> API: 1.3.17. Đã ghi
deactivate DB

API --> CT: 1.4. Thành công: Công việc đã cập nhật
deactivate API
CT -> CT: 1.5. Cập nhật giao diện
CT --> ND: 2. Hiển thị trạng thái mới
deactivate CT

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Số | Ý nghĩa |
|----|---------|
| 1, 2 | Giai đoạn: Xử lý, Hiển thị |
| 1.1 - 1.5 | Các bước giao diện và API |
| 1.3.1 - 1.3.17 | Chi tiết xử lý API |
| 1.3.5.1, 1.3.5.2 | Xử lý trong kiểm tra workflow |
| 1.3.12.1 - 1.3.12.4 | Xử lý gửi thông báo |

---

## 5. Quy tắc workflow

| Trường hợp | Hành vi |
|------------|---------|
| Quản trị viên | Bỏ qua kiểm tra workflow |
| Người dùng thường | Kiểm tra WorkflowTransition |
| roleId = null | Áp dụng cho tất cả vai trò |

---

## 6. Quy tắc doneRatio tự động

| Điều kiện | doneRatio |
|-----------|-----------|
| Trạng thái đóng (isClosed = true) | 100% |
| Từ đóng sang mở | defaultDoneRatio hoặc 0 |
| Khác | Giữ nguyên |

---

*Ngày tạo: 2026-01-16*
