# Activity Diagram 04: Xóa dự án (UC-12)

> **Use Case**: UC-12 - Xóa dự án  
> **Module**: Project Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User (Creator/Admin) |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |
| **Đặc điểm** | Cascade Delete, Fork/Join |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Xóa dự án (UC-12)

|User|
start
:Truy cập Project Settings;
:Click "Xóa dự án";

|System|
:Hiển thị dialog cảnh báo;
note right
  "Hành động này không thể hoàn tác"
  "Nhập tên dự án để xác nhận"
end note

|User|
:Nhập tên dự án;
:Click "Xác nhận xóa";

|System|
if (Tên dự án khớp?) then (Không)
  :Hiển thị lỗi "Tên không khớp";
  |User|
  stop
endif

:Check permission;

if (Là Creator hoặc Admin?) then (Không)
  :Hiển thị lỗi 403 Forbidden;
  |User|
  stop
endif

|Database|
fork
  :DELETE Comments WHERE taskId IN project;
fork again
  :DELETE Attachments WHERE taskId IN project;
  :Xóa files từ disk;
fork again
  :DELETE Watchers WHERE taskId IN project;
fork again
  :DELETE Notifications WHERE projectId;
end fork

:DELETE Tasks WHERE projectId;
note right
  Subtasks tự động xóa
  do ON DELETE CASCADE
end note

:DELETE Versions WHERE projectId;
:DELETE ProjectMembers WHERE projectId;
:DELETE Project WHERE id;

|System|
:Trả về success;

|User|
:Redirect đến /projects;
:Hiển thị thông báo "Đã xóa dự án";

stop

@enduml
```

---

## 3. Mô tả Cascade Delete

| Thứ tự | Entity | Điều kiện | Ghi chú |
|--------|--------|-----------|---------|
| 1 | Comments | taskId IN project tasks | - |
| 2 | Attachments | taskId IN project tasks | + Xóa files |
| 3 | Watchers | taskId IN project tasks | - |
| 4 | Notifications | projectId | - |
| 5 | Tasks | projectId | Subtasks cascade |
| 6 | Versions | projectId | - |
| 7 | ProjectMembers | projectId | - |
| 8 | Project | id | Finally |

---

## 4. Decision Points

| # | Condition | True | False |
|---|-----------|------|-------|
| D1 | Tên dự án khớp? | Tiếp tục | Hiển thị lỗi |
| D2 | Là Creator/Admin? | Cascade delete | 403 Forbidden |

---

## 5. Lưu ý quan trọng

⚠️ **Không thể hoàn tác** - Dữ liệu bị xóa vĩnh viễn

---

*Ngày tạo: 2026-01-15*
