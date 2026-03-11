# Use Case: Quản lý Phiên bản (Version/Roadmap)

Thiết lập, theo dõi và quản lý các Version (Phiên bản phát hành) của dự án.

```plantuml
@startuml
left to right direction
actor "Administrator/User" as User

usecase "quản lý phiên bản" as UC_ManageVersion

' Các use case con
usecase "xem danh sách & tiến độ" as UC01
usecase "thêm phiên bản" as UC02
usecase "cập nhật thông tin" as UC03
usecase "cập nhật trạng thái (mở/khóa/đóng)" as UC04
usecase "xóa phiên bản" as UC05

' Note
note "user phải có quyền quản lý \nphiên bản hoặc là Admin" as N1

User --> UC_ManageVersion
UC_ManageVersion .. N1

UC_ManageVersion --> UC01
UC_ManageVersion --> UC02
UC_ManageVersion --> UC03
UC_ManageVersion --> UC04
UC_ManageVersion --> UC05

@enduml
```

### Quy tắc nghiệp vụ (Business Rules)
*   Tiến độ (Progress) của một Phiên bản hoàn toàn thuộc dạng Logic "Đọc động" (Computed Reading), nó không lưu % cứng dưới db mà được API tính toán trực tiếp vào thời điểm Load data: `Progress = ClosedTasks / TotalTasks`
*   Xóa Version là kiểu hành vi **Unlink (Gỡ bỏ liên kết)**, các Tasks trực thuộc nó sẽ không bị xóa Cascade theo. Mất Version thì task bị trạng thái trở thành tác vụ tự do (Bảo vệ tính toàn vẹn).
