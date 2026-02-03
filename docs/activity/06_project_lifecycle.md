# Activity Diagram: Quản lý Dự án (Vòng đời dự án)

Mô tả luồng tạo mới, cập nhật, lưu trữ và xóa dự án.

```plantuml
@startuml
|Admin/Manager|
start
:Truy cập trang Danh sách Dự án;

if (Hành động?) then (Tạo mới)
  :Nhấn "New Project";
  :Nhập Info (Tên, Mã, Mô tả, Parent Project);
  :Cấu hình Modules (Trackers enabled);
  :Nhấn "Lưu";
  
  |System|
  :Validate Input;
  :Check Identifier duy nhất;
  if (Duplicate ID?) then (Yes)
    :Báo lỗi "Identifier exists";
    stop
  endif
  :Tạo Project Record;
  :Tạo liên kết với Trackers đã chọn;
  :Thêm người tạo làm Member (Role Manager/Admin);
  :Ghi Audit Log;
  |Admin/Manager|
  :Redirect sang trang chi tiết Project;
  stop

else (Cập nhật Settings)
  :Vào Project Settings;
  :Sửa thông tin / Bật tắt Modules;
  :Nhấn "Lưu";
  |System|
  :Update DB;
  :Ghi Audit Log;
  stop

else (Lưu trữ / Archive)
  :Nhấn "Archive";
  |System|
  :Set status = ARCHIVED;
  :Archive tất cả Sub-projects (đệ quy);
  :Vô hiệu hóa chỉnh sửa Task trong Project;
  stop

else (Xóa / Delete)
  :Nhấn "Delete";
  :Confirm Warning;
  |System|
  :Check Permission (Admin Only);
  :Xóa đệ quy:
  - Sub-projects
  - Tasks
  - Members
  - Wiki/Docs
  - TimeLogs;
  :Delete Project Record;
  stop
endif
@enduml
```
