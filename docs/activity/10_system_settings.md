# Activity Diagram: Quản lý Cấu hình Hệ thống (System Definitions)

Mô tả luồng quản lý chung cho các danh mục nền tảng: Tracker, Status, Priority, Role.

```plantuml
@startuml
|Administrator|
start
:Truy cập Admin Dashboard (Settings);
:Chọn danh mục quản lý (Tracker / Status / Priority / Role);

if (Hành động?) then (Tạo mới)
  :Nhấn nút "Create New";
  :Nhập thông tin (Tên, Màu sắc, Default?);
  if (Role?) then (Yes)
     :Cấu hình Permissions (View, Edit, Delete...);
  else (No)
     :Cấu hình thuộc tính (Is Closed?, Position...);
  endif
  :Nhấn "Save";
  
  |System|
  :Validate Input (Tên không trùng lặp);
  :Lưu vào DB;
  :Ghi Audit Log;
  stop

else (Cập nhật)
  :Chọn Item cần sửa;
  :Thay đổi thông tin;
  :Nhấn "Save";
  |System|
  :Update DB;
  :Ghi Audit Log;
  stop

else (Xóa)
  :Nhấn "Delete";
  |System|
  :Check Dependency (Ràng buộc dữ liệu);
  note right
    Ví dụ: Không được xóa Status 
    đang được sử dụng bởi Task nào đó
  end note
  
  if (Đang được sử dụng?) then (Yes)
    :Trả lỗi 400 "Item is in use";
    |Administrator|
    :Nhận thông báo lỗi;
    stop
  else (No)
    |System|
    :Xóa Item khỏi DB;
    :Xóa các liên kết phụ (RoleTracker...);
    :Ghi Audit Log;
    :Trả về Success;
    stop
  endif
endif
@enduml
```
