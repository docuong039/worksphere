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
:Cascade Delete trong transaction;

:DELETE Comments WHERE taskId IN project tasks;
:DELETE Attachments WHERE taskId IN project tasks;
note right
  Chỉ xóa records, **KHÔNG** 
  xóa files vật lý từ disk
end note
:DELETE Watchers WHERE taskId IN project tasks;
:DELETE Tasks WHERE projectId;
note right
  Subtasks tự động xóa
  do ON DELETE CASCADE
end note
:DELETE ProjectMembers WHERE projectId;
:DELETE Project WHERE id;
note right
  Versions được xóa tự động
  bởi Prisma cascade
end note

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
| 1 | Comments | taskId IN project tasks | Xóa explicit |
| 2 | Attachments | taskId IN project tasks | **Chỉ xóa DB**, KHÔNG xóa files |
| 3 | Watchers | taskId IN project tasks | Xóa explicit |
| 4 | Tasks | projectId | Subtasks cascade |
| 5 | ProjectMembers | projectId | Xóa explicit |
| 6 | Project | id | Finally |
| - | Versions | projectId | Prisma cascade tự động |

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
