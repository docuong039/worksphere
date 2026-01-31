# Use Case: Quản lý Trạng thái (Statuses)

Cấu hình các trạng thái của quy trình (New, In Progress, Done...).

```plantuml
@startuml
left to right direction
actor "Administrator" as Admin

usecase "đăng nhập" as UC_Login
usecase "quản lý trạng thái" as UC_ManageStatus

' Các use case con
usecase "xem danh sách" as UC01
usecase "thêm" as UC02
usecase "sửa" as UC03
usecase "xóa" as UC04

Admin --> UC_ManageStatus

UC_ManageStatus --> UC01
UC_ManageStatus --> UC02
UC_ManageStatus --> UC03
UC_ManageStatus --> UC04

UC_ManageStatus ..> UC_Login : <<Include>>

@enduml
```
