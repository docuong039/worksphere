# Biểu đồ trình tự 07: Thêm bình luận (UC-30)

> **Use Case**: UC-30 - Thêm bình luận  
> **Module**: Bình luận  
> **Mã nguồn**: `src/app/api/tasks/[id]/comments/route.ts` (POST)

---

## 1. Phân tích

| Thành phần | Xác định |
|------------|----------|
| **Tác nhân** | Người dùng (thành viên dự án) |
| **Biên** | Chi tiết công việc, API |
| **Điều khiển** | Kiểm tra quyền, Thông báo |
| **Thực thể** | Cơ sở dữ liệu (Comment, Task, Watcher) |

---

## 2. Các đối tượng tham gia

- **Tác nhân**: Người dùng
- **Biên**: Trang chi tiết công việc, API
- **Điều khiển**: Kiểm tra thành viên, Thông báo
- **Thực thể**: Prisma (Comment, Task, Watcher, Notification)

---

## 3. Mã PlantUML

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Biểu đồ trình tự: Thêm bình luận (UC-30)
footer Mã nguồn: src/app/api/tasks/[id]/comments/route.ts

actor "Người dùng" as ND
boundary "Chi tiết\\ncông việc" as CT #LightGreen
boundary "API" as API #LightBlue
control "Thông báo" as TB #Pink
database "Cơ sở\\ndữ liệu" as DB #LightGray

== 1. Nhập bình luận ==
ND -> CT: 1. Nhập nội dung bình luận
activate CT
ND -> CT: 1.1. Nhấn "Gửi" hoặc Enter
CT -> API: 1.2. POST /api/tasks/{id}/comments
activate API

== 2. Kiểm tra và xác thực ==
API -> API: 1.2.1. Lấy thông tin phiên đăng nhập
alt Chưa đăng nhập
    API --> CT: 1.3. Lỗi 401: "Chưa đăng nhập"
    CT --> ND: 2. Chuyển đến trang đăng nhập
end

API -> DB: 1.2.2. Tìm công việc và kiểm tra tồn tại
activate DB
DB --> API: 1.2.3. Thông tin công việc
deactivate DB

alt Công việc không tồn tại
    API --> CT: 1.3. Lỗi 404: "Công việc không tồn tại"
    CT --> ND: 2. Hiển thị lỗi
end

== 3. Kiểm tra quyền thành viên ==
API -> DB: 1.2.4. Kiểm tra người dùng là thành viên dự án
activate DB
DB --> API: 1.2.5. Kết quả kiểm tra
deactivate DB

alt Không phải thành viên
    API --> CT: 1.3. Lỗi 403: "Không phải thành viên dự án"
    CT --> ND: 2. Hiển thị lỗi
end

== 4. Kiểm tra nội dung ==
API -> API: 1.2.6. Kiểm tra nội dung không rỗng
alt Nội dung rỗng
    API --> CT: 1.3. Lỗi 400: "Nội dung không được trống"
    CT --> ND: 2. Hiển thị lỗi
end

== 5. Tạo bình luận ==
API -> DB: 1.2.7. Tạo bình luận mới
activate DB
note right of DB
    prisma.comment.create({
        data: {
            content,
            taskId,
            userId: session.user.id
        }
    })
end note
DB --> API: 1.2.8. Thông tin bình luận
deactivate DB

== 6. Cập nhật thời gian công việc ==
API -> DB: 1.2.9. Cập nhật task.updatedAt
activate DB
DB --> API: 1.2.10. Đã cập nhật
deactivate DB

== 7. Gửi thông báo ==
API -> DB: 1.2.11. Lấy danh sách người theo dõi
activate DB
DB --> API: 1.2.12. Danh sách watchers
deactivate DB

opt Có người theo dõi
    API -> TB: 1.2.13. Gửi thông báo cho watchers
    activate TB
    loop Với mỗi watcher (trừ người bình luận)
        TB -> DB: 1.2.13.1. Tạo thông báo
        activate DB
        DB --> TB: 1.2.13.2. Đã tạo
        deactivate DB
    end
    TB --> API: 1.2.14. Đã thông báo
    deactivate TB
end

API --> CT: 1.3. Thành công: Thông tin bình luận
deactivate API
CT -> CT: 1.4. Thêm bình luận vào danh sách
CT -> CT: 1.5. Xóa nội dung trong ô nhập
CT --> ND: 2. Hiển thị bình luận mới
deactivate CT

@enduml
```

---

## 4. Giải thích quy tắc đánh số

| Số | Ý nghĩa |
|----|---------|
| 1, 2 | Giai đoạn: Gửi, Hiển thị kết quả |
| 1.1 - 1.5 | Các bước trong giai đoạn 1 |
| 1.2.1 - 1.2.14 | Chi tiết xử lý API |
| 1.2.13.1, 1.2.13.2 | Vòng lặp gửi thông báo |

---

## 5. Quy tắc nghiệp vụ

| Quy tắc | Mô tả |
|---------|-------|
| Chỉ thành viên | Chỉ thành viên dự án mới được bình luận |
| Nội dung bắt buộc | Bình luận không được rỗng |
| Cập nhật timestamp | Task.updatedAt được cập nhật khi có bình luận |
| Thông báo watchers | Gửi thông báo cho người theo dõi (trừ người bình luận) |

---

*Ngày tạo: 2026-01-16*
