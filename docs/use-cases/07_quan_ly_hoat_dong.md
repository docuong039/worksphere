# Use Case: Quản lý Hoạt động thời gian (Activities)

Cấu hình các loại hoạt động để ghi nhận thời gian (Development, Design, Meeting...).

```plantuml
@startuml
left to right direction
actor "Administrator" as Admin

usecase "đăng nhập" as UC_Login
usecase "quản lý hoạt động" as UC_ManageActivity

' Các use case con
usecase "xem danh sách" as UC01
usecase "thêm" as UC02
usecase "sửa" as UC03
usecase "kích hoạt/ vô hiệu hóa" as UC04
usecase "xóa" as UC05

Admin --> UC_ManageActivity

UC_ManageActivity --> UC01
UC_ManageActivity --> UC02
UC_ManageActivity --> UC03
UC_ManageActivity --> UC04
UC_ManageActivity --> UC05

UC_ManageActivity ..> UC_Login : <<Include>>

@enduml
```
