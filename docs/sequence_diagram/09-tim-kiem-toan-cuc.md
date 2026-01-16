# Biểu đồ trình tự 09: Tìm kiếm toàn cục (UC-44)

> **Use Case**: UC-44 - Tìm kiếm toàn cục  
> **Module**: Tìm kiếm  
> **Mã nguồn**: `src/app/api/search/route.ts`

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng đã đăng nhập |
| **Biên** | Hộp tìm kiếm, API |
| **Điều khiển** | Xây dựng truy vấn, Lọc quyền |
| **Thực thể** | Cơ sở dữ liệu (Task, Project, Comment, User) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Global Search, API /api/search
- **Điều khiển**: Xây dựng truy vấn
- **Thực thể**: Prisma (Task, Project, Comment, User)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Tìm kiếm toàn cục (UC-44)
footer Mã nguồn: src/app/api/search/route.ts

actor "Người dùng" as ND
boundary "Hộp\\ntìm kiếm" as HT #LightGreen
boundary "API" as API #LightBlue
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Mở hộp tìm kiếm ==
ND -> HT: 1. Nhấn Ctrl+K hoặc click biểu tượng
activate HT
HT -> HT: 1.1. Hiển thị hộp thoại tìm kiếm
HT --> ND: 1.2. Hiển thị ô nhập từ khóa

== 2. Nhập từ khóa ==
ND -> HT: 2. Nhập từ khóa tìm kiếm
HT -> HT: 2.1. Kiểm tra độ dài từ khóa
alt Từ khóa < 2 ký tự
    HT --> ND: 2.2. "Nhập ít nhất 2 ký tự"
else Từ khóa >= 2 ký tự
    HT -> API: 2.2. GET /api/search?q={keyword}
    activate API
end

== 3. Xác định phạm vi tìm kiếm ==
API -> API: 2.2.1. Lấy thông tin phiên đăng nhập
API -> DB: 2.2.2. Lấy danh sách dự án người dùng tham gia
activate DB
note right of DB
    Admin: tất cả dự án
    User: dự án là thành viên
end note
DB --> API: 2.2.3. Danh sách ID dự án
deactivate DB

== 4. Tìm kiếm song song ==
par Tìm kiếm công việc
    API -> DB: 2.2.4. Tìm trong bảng Task
    activate DB
    note right of DB
        Tìm trong: title, description
        Điều kiện: projectId IN (dự án được phép)
        Giới hạn: 5 kết quả
    end note
    DB --> API: 2.2.5. Danh sách công việc
    deactivate DB
else Tìm kiếm dự án
    API -> DB: 2.2.6. Tìm trong bảng Project
    activate DB
    note right of DB
        Tìm trong: name, identifier
        Điều kiện: id IN (dự án được phép)
        Giới hạn: 5 kết quả
    end note
    DB --> API: 2.2.7. Danh sách dự án
    deactivate DB
else Tìm kiếm bình luận
    API -> DB: 2.2.8. Tìm trong bảng Comment
    activate DB
    note right of DB
        Tìm trong: content
        Điều kiện: task.projectId IN (dự án được phép)
        Giới hạn: 5 kết quả
    end note
    DB --> API: 2.2.9. Danh sách bình luận
    deactivate DB
else Tìm kiếm người dùng (chỉ Admin)
    opt Là quản trị viên
        API -> DB: 2.2.10. Tìm trong bảng User
        activate DB
        note right of DB
            Tìm trong: name, email
            Giới hạn: 5 kết quả
        end note
        DB --> API: 2.2.11. Danh sách người dùng
        deactivate DB
    end
end

== 5. Trả về kết quả ==
API -> API: 2.2.12. Nhóm kết quả theo loại
API --> HT: 2.3. { tasks, projects, comments, users }
deactivate API

HT -> HT: 2.4. Hiển thị kết quả theo nhóm
alt Có kết quả
    HT --> ND: 3. Hiển thị danh sách kết quả
else Không có kết quả
    HT --> ND: 3. "Không tìm thấy kết quả"
end

== 6. Chọn kết quả ==
ND -> HT: 4. Chọn một kết quả
HT -> HT: 4.1. Đóng hộp thoại
HT --> ND: 4.2. Chuyển đến trang chi tiết
deactivate HT

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Số | Ý nghĩa |
|----|---------|
| 1, 2, 3, 4 | Giai đoạn chính |
| 2.1, 2.2, 2.3, 2.4 | Các bước trong nhập từ khóa |
| 2.2.1 - 2.2.12 | Chi tiết xử lý API |

---

## 5. Phạm vi tìm kiếm

| Đối tượng | Trường tìm kiếm | Điều kiện |
|-----------|-----------------|-----------|
| Công việc | title, description | Dự án được phép |
| Dự án | name, identifier | Dự án được phép |
| Bình luận | content | Công việc trong dự án được phép |
| Người dùng | name, email | Chỉ Admin |

---

## 6. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Tối thiểu 2 ký tự | Phải nhập ít nhất 2 ký tự |
| Giới hạn 5 kết quả | Mỗi loại tối đa 5 kết quả |
| Lọc theo quyền | Non-admin chỉ thấy dự án mình tham gia |
| User search chỉ Admin | Chỉ Admin mới tìm được người dùng |

---

*Ngày tạo: 2026-01-16*
