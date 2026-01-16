# Biểu đồ trình tự 13: Cập nhật công việc (UC-25)

> **Use Case**: UC-25 - Cập nhật công việc  
> **Module**: Quản lý công việc  
> **Mã nguồn**: `src/app/api/tasks/[id]/route.ts` (PUT)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng (có quyền chỉnh sửa) |
| **Biên** | Form chỉnh sửa, API |
| **Điều khiển** | Kiểm tra quyền, Workflow, Optimistic Lock |
| **Thực thể** | Cơ sở dữ liệu (Task, ProjectMember, Status, Notification) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: TaskEditPage, API `/api/tasks/[id]`
- **Điều khiển**: `canEditTask`, `canTransitionStatus`, `notifyTaskAssigned`
- **Thực thể**: Prisma (Task, Member, Status)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Cập nhật công việc (UC-25)
footer Mã nguồn: src/app/api/tasks/[id]/route.ts

actor "Người dùng" as ND
boundary "Form\\nChỉnh sửa" as FRM #LightGreen
boundary "API" as API #LightBlue
control "Kiểm tra\\nQuyền" as PERM #Orange
control "Logic\\nNghiệp vụ" as LOGIC #Yellow
control "Hệ thống\\nThông báo" as NOTI #Pink
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Gửi yêu cầu cập nhật ==
ND -> FRM: 1. Sửa thông tin & Lưu
activate FRM
note right of ND
  Sửa: Tiêu đề, Trạng thái,
  Người thực hiện, Tracker...
end note

FRM -> API: 2. PUT /api/tasks/{id}
activate API

== 2. Xác thực & Kiểm tra quyền cơ bản ==
API -> API: 2.1. Lấy session & Validate Input
API -> PERM: 2.2. canEditTask(userId, taskId)
activate PERM
PERM -> DB: 2.2.1. Lấy thông tin Task & Member Permissions
activate DB
DB --> PERM: 2.2.2. Dữ liệu phân quyền
deactivate DB
PERM --> API: 2.3. Kết quả (true/false)
deactivate PERM

alt Không có quyền sửa
    API --> FRM: 2.4. Lỗi 403: "Không có quyền sửa task này"
    FRM --> ND: 3. Hiển thị lỗi
end

== 3. Kiểm tra dữ liệu hiện tại (Optimistic Locking) ==
API -> DB: 2.5. Lấy Task hiện tại (currentTask)
activate DB
DB --> API: 2.6. Task object
deactivate DB

alt Task không tồn tại
    API --> FRM: 2.7. Lỗi 404
end

API -> LOGIC: 2.8. Kiểm tra lockVersion
activate LOGIC
alt lockVersion không khớp (Conflict)
    LOGIC --> API: 2.8.1. Conflict
    API --> FRM: 2.9. Lỗi 409: "Dữ liệu đã bị thay đổi bởi người khác"
    FRM --> ND: 3. Yêu cầu tải lại trang
end
deactivate LOGIC

== 4. Kiểm tra nghiệp vụ chi tiết ==
par Kiểm tra Workflow (nếu đổi Status)
    API -> PERM: 2.10. canTransitionStatus()
    activate PERM
    perm --> API: 2.10.1. Kết quả
    deactivate PERM
    alt Vi phạm Workflow
        API --> FRM: 2.11. Lỗi 403: Workflow violation
    end
else Kiểm tra Tracker (nếu đổi Tracker)
    API -> DB: 2.12. Kiểm tra Tracker trong Project & Role
    activate DB
    DB --> API: 2.13. Kết quả
    deactivate DB
    alt Vi phạm Tracker
        API --> FRM: 2.14. Lỗi 403/400
    end
else Kiểm tra Người thực hiện (nếu đổi Assignee)
    API -> DB: 2.15. Kiểm tra Assignee là Member
    activate DB
    DB --> API: 2.16. Kết quả
    deactivate DB
    
    API -> DB: 2.17. Kiểm tra quyền "canAssignToOther" của người sửa
    activate DB
    DB --> API: 2.18. Kết quả
    deactivate DB
    
    alt Vi phạm quy tắc gán
        API --> FRM: 2.19. Lỗi 403/400
    end
end

== 5. Thực hiện Cập nhật ==
API -> API: 2.20. Chuẩn bị dữ liệu (updateData)
note right of API
  - Tăng lockVersion
  - Tính toán doneRatio (nếu cần)
  - Cập nhật Path/Level (nếu đổi Parent)
end note

API -> DB: 2.21. prisma.task.update()
activate DB
DB --> API: 2.22. Updated Task
deactivate DB

== 6. Xử lý hậu cập nhật (Async) ==
par Cập nhật tiến độ cha (Roll-up)
    API -> LOGIC: 2.23. updateParentAttributes()
    activate LOGIC
    LOGIC -> DB: 2.23.1. Tính toán & Cập nhật Task cha
    deactivate LOGIC
else Gửi thông báo
    opt Đổi người thực hiện
        API -> NOTI: 2.24. notifyTaskAssigned()
        activate NOTI
        NOTI -> DB: 2.24.1. Tạo Notification
        deactivate NOTI
    end
    opt Đổi trạng thái
        API -> NOTI: 2.25. notifyTaskStatusChanged()
        activate NOTI
        NOTI -> DB: 2.25.1. Tạo Notification
        deactivate NOTI
    end
else Ghi Audit Log
    API -> DB: 2.26. logUpdate()
end

== 7. Phản hồi ==
API --> FRM: 2.27. Thành công 200 (Updated Task)
deactivate API
FRM --> ND: 3. Hiển thị thông tin mới
deactivate FRM

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Cấp độ | Ý nghĩa |
|--------|---------|
| 1, 2, 3 | Các giai đoạn chính (Gửi, Xử lý, Phản hồi) |
| 2.1, 2.2... | Các bước xử lý trong API |
| 2.2.1, 2.2.2... | Chi tiết gọi hàm con hoặc DB |

---

## 5. Các cơ chế bảo vệ quan trọng

| Cơ chế | Mục đích |
|--------|----------|
| **Optimistic Locking** | Ngăn chặn việc ghi đè dữ liệu khi nhiều người cùng sửa (dựa trên `lockVersion`). |
| **Workflow Check** | Đảm bảo chuyển trạng thái tuân thủ quy trình đã định nghĩa. |
| **RBAC Check** | Kiểm tra quyền sửa (`edit_any`, `edit_own`, `edit_assigned`) và quyền gán (`canAssignToOther`). |
| **Consistency Check** | Đảm bảo Assignee là thành viên dự án, Parent task hợp lệ (không vòng lặp, max level). |

---

*Ngày tạo: 2026-01-16*
