# Activity Diagram 05: Thêm thành viên vào dự án (UC-14)

> **Use Case**: UC-14 - Thêm thành viên vào dự án  
> **Module**: Project Members  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |
| **Đặc điểm** | Loop xử lý nhiều users |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Thêm thành viên vào dự án (UC-14)

|User|
start
:Truy cập Project Settings > Members;
:Click "Thêm thành viên";

|System|
:Load danh sách users chưa là member;
:Load danh sách roles;
:Hiển thị form thêm member;

|User|
:Chọn users từ dropdown;
note right
  Có thể chọn nhiều users
end note
:Chọn Role;
:Click "Thêm";

|System|
:Check permission projects.manage_members;

if (Có quyền?) then (Không)
  :Hiển thị lỗi 403 Forbidden;
  |User|
  stop
endif

:Validate role exists;

if (Role hợp lệ?) then (Không)
  :Hiển thị lỗi "Role không tồn tại";
  |User|
  stop
endif

|Database|
while (Còn user trong danh sách?)
  :Get user hiện tại;
  
  :Check user đã là member?;
  
  if (Đã là member?) then (Có)
    :Skip user này;
  else (Chưa)
    :INSERT ProjectMember;
    note right
      userId, projectId, roleId
    end note
  endif
endwhile

|System|
:Trả về danh sách members mới;

|User|
:Refresh danh sách members;
:Hiển thị thông báo thành công;

stop

@enduml
```

---

## 3. Mô tả các bước

| # | Actor | Hành động | Ghi chú |
|---|-------|-----------|---------|
| 1 | User | Vào Settings > Members | - |
| 2 | System | Load users & roles | Exclude existing members |
| 3 | User | Chọn users và role | Multi-select |
| 4 | System | Check permission | manage_members |
| 5 | System | Validate role | Role exists |
| 6 | Database | Loop: Create members | Skip duplicates |
| 7 | User | View updated list | Refresh |

---

## 4. Business Rules

| Rule | Mô tả |
|------|-------|
| BR-01 | Cần quyền projects.manage_members |
| BR-02 | Có thể thêm nhiều users cùng lúc |
| BR-03 | Skip users đã là member |
| BR-04 | Mỗi user chỉ có 1 role trong 1 project |

---

*Ngày tạo: 2026-01-15*
