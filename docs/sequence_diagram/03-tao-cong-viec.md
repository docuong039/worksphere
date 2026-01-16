# Biểu đồ trình tự 03: Tạo công việc mới (UC-24)

> **Use Case**: UC-24 - Tạo công việc mới  
> **Module**: Quản lý công việc  
> **Mã nguồn**: `src/app/api/tasks/route.ts` (POST)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng (có quyền tạo công việc) |
| **Biên** | Form tạo công việc, API |
| **Điều khiển** | Kiểm tra quyền, Validation, Thông báo |
| **Thực thể** | Cơ sở dữ liệu (Task, ProjectMember, Tracker) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Form công việc, API /api/tasks
- **Điều khiển**: Kiểm tra quyền, Zod, Thông báo
- **Thực thể**: Prisma (Task, ProjectTracker, ProjectMember)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Tạo công việc mới (UC-24)
footer Mã nguồn: src/app/api/tasks/route.ts

actor "Người dùng" as ND
boundary "Form\\nCông việc" as FRM #LightGreen
boundary "API" as API #LightBlue
control "Kiểm tra\\nquyền" as KTQ #Orange
control "Validation" as VAL #Yellow
control "Thông báo" as TB #Pink
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Mở form tạo công việc ==
ND -> FRM: 1. Nhấn "Tạo công việc"
activate FRM
FRM -> FRM: 1.1. Tải danh sách loại, trạng thái, thành viên
FRM --> ND: 1.2. Hiển thị form

== 2. Gửi thông tin công việc ==
ND -> FRM: 2. Điền thông tin
note right of ND
    - Tiêu đề
    - Loại công việc
    - Trạng thái, độ ưu tiên
    - Người thực hiện
    - Công việc cha (nếu có)
end note
ND -> FRM: 2.1. Nhấn nút "Tạo"
FRM -> API: 2.2. POST /api/tasks
activate API

== 3. Xác thực và phân tích ==
API -> API: 2.2.1. Lấy thông tin phiên đăng nhập
API -> VAL: 2.2.2. Kiểm tra dữ liệu đầu vào
activate VAL
VAL --> API: 2.2.3. Dữ liệu đã xác thực
deactivate VAL

== 4. Kiểm tra quyền tạo công việc ==
API -> KTQ: 2.2.4. Kiểm tra quyền trong dự án
activate KTQ
KTQ -> DB: 2.2.4.1. Truy vấn thành viên và quyền
activate DB
DB --> KTQ: 2.2.4.2. Thông tin thành viên
deactivate DB
KTQ --> API: 2.2.5. Kết quả kiểm tra
deactivate KTQ

alt Không có quyền
    API --> FRM: 2.3. Lỗi 403: "Không có quyền thêm công việc"
    FRM --> ND: 3. Hiển thị lỗi
end

== 5. Kiểm tra loại công việc ==
API -> DB: 2.2.6. Kiểm tra Tracker được kích hoạt
activate DB
DB --> API: 2.2.7. Kết quả kiểm tra
deactivate DB

alt Loại công việc không được kích hoạt
    API --> FRM: 2.3. Lỗi 400: "Loại công việc không khả dụng"
    FRM --> ND: 3. Hiển thị lỗi
end

== 6. Kiểm tra người thực hiện (nếu có) ==
opt Có chọn người thực hiện
    API -> DB: 2.2.8. Kiểm tra người thực hiện là thành viên
    activate DB
    DB --> API: 2.2.9. Kết quả kiểm tra
    deactivate DB
    
    alt Không phải thành viên dự án
        API --> FRM: 2.3. Lỗi 400: "Người thực hiện không phải thành viên"
        FRM --> ND: 3. Hiển thị lỗi
    end
    
    alt Gán cho người khác
        API -> DB: 2.2.10. Kiểm tra quyền gán việc
        activate DB
        DB --> API: 2.2.11. Quyền canAssignToOther
        deactivate DB
        
        alt Không có quyền gán cho người khác
            API --> FRM: 2.3. Lỗi 403: "Không có quyền giao việc cho người khác"
            FRM --> ND: 3. Hiển thị lỗi
        end
    end
end

== 7. Kiểm tra công việc cha (nếu là subtask) ==
opt Có chọn công việc cha
    API -> DB: 2.2.12. Tìm công việc cha
    activate DB
    DB --> API: 2.2.13. Thông tin công việc cha
    deactivate DB
    
    API -> API: 2.2.14. Tính toán cấp độ và đường dẫn
    note right
        level = cha.level + 1
        path = cha.path + "." + cha.id
        Tối đa 5 cấp
    end note
    
    alt Vượt quá độ sâu tối đa
        API --> FRM: 2.3. Lỗi 400: "Vượt quá độ sâu tối đa (5 cấp)"
        FRM --> ND: 3. Hiển thị lỗi
    end
end

== 8. Tạo công việc ==
API -> DB: 2.2.15. Tạo công việc mới
activate DB
note right of DB
    Dữ liệu:
    - tiêu đề, mô tả
    - loại, trạng thái, độ ưu tiên
    - người thực hiện, phiên bản
    - ngày bắt đầu, ngày đến hạn
    - doneRatio: 0
    - level, path
end note
DB --> API: 2.2.16. Thông tin công việc
deactivate DB

== 9. Xử lý sau khi tạo ==
opt Người thực hiện khác người tạo
    API -> TB: 2.2.17. Gửi thông báo cho người thực hiện
    activate TB
    TB -> DB: 2.2.17.1. Lưu thông báo
    activate DB
    DB --> TB: 2.2.17.2. Đã lưu
    deactivate DB
    TB --> API: 2.2.18. Đã thông báo
    deactivate TB
end

API -> DB: 2.2.19. Ghi nhật ký tạo công việc
activate DB
DB --> API: 2.2.20. Đã ghi
deactivate DB

opt Có công việc cha
    API -> DB: 2.2.21. Cập nhật thuộc tính công việc cha
    activate DB
    note right: Tính toán lại tiến độ
    DB --> API: 2.2.22. Đã cập nhật
    deactivate DB
end

API --> FRM: 2.3. Thành công 201: Thông tin công việc
deactivate API
FRM --> ND: 3. Hiển thị thông báo thành công
deactivate FRM

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Cấp độ | Ví dụ | Ý nghĩa |
|--------|-------|---------|
| Cấp 1 | 1, 2, 3 | Giai đoạn chính |
| Cấp 2 | 2.1, 2.2, 2.3 | Hành động con |
| Cấp 3 | 2.2.1, 2.2.2 | Chi tiết xử lý API |
| Cấp 4 | 2.2.4.1, 2.2.17.1 | Xử lý sâu (DB trong service) |

---

## 5. Các quy tắc kiểm tra

| Kiểm tra | Mô tả |
|----------|-------|
| Quyền tạo | Cần quyền `tasks.create` trong dự án |
| Loại công việc | Tracker phải được kích hoạt cho dự án |
| Người thực hiện | Phải là thành viên dự án |
| Gán cho người khác | Cần quyền `canAssignToOther = true` |
| Công việc cha | Cùng dự án, tối đa 5 cấp lồng nhau |

---

## 6. Xử lý sau khi tạo

| Hành động | Điều kiện |
|-----------|-----------|
| Gửi thông báo | Người thực hiện khác người tạo |
| Ghi nhật ký | Luôn thực hiện |
| Cập nhật cha | Nếu là công việc con |

---

*Ngày tạo: 2026-01-16*
