# Activity Diagram 11: Sao chép công việc (UC-41)

> **Use Case**: UC-41 - Sao chép công việc  
> **Module**: Task Copy  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |
| **Đặc điểm** | Recursive copy subtasks, Cross-project |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Sao chép công việc (UC-41)

|User|
start
:Mở chi tiết công việc gốc;
:Click "Sao chép";

|System|
:Load task data;
:Hiển thị form với dữ liệu điền sẵn;
:Load danh sách projects user có quyền;

|User|
:Chọn Project đích;
:Chỉnh sửa các trường nếu cần;
:Check/Uncheck "Sao chép công việc con";
:Click "Sao chép";

|System|
:Check permission tasks.create ở project đích;

if (Có quyền?) then (Không)
  :Hiển thị lỗi 403 Forbidden;
  |User|
  stop
endif

|Database|
:Get max taskNumber trong project đích;
:newTaskNumber = max + 1;

:INSERT new Task;
note right
  Copy tất cả fields
  Trừ: id, taskNumber, projectId
  Set: projectId = đích
  Set: taskNumber = new
  Set: parentId = null
end note

:Get new task ID;

|System|
if (Copy subtasks checked?) then (Có)
  |Database|
  :SELECT subtasks WHERE parentId = original;
  
  |System|
  while (Còn subtask?)
    |Database|
    :newSubNumber = max + 1;
    :INSERT subtask copy;
    note right
      Set parentId = new parent task
    end note
  endwhile
endif

|Database|
:INSERT AuditLog;

|System|
:Trả về task mới;

|User|
:Redirect đến task mới;
:Hiển thị thông báo thành công;

stop

@enduml
```

---

## 3. Mô tả các bước

| # | Actor | Hành động | Ghi chú |
|---|-------|-----------|---------|
| 1 | User | Click sao chép | Mở form |
| 2 | System | Load data | Prefill form |
| 3 | User | Chọn project đích | Dropdown |
| 4 | User | Chỉnh sửa fields | Optional |
| 5 | User | Check copy subtasks | Optional |
| 6 | System | Check permission | tasks.create |
| 7 | Database | Generate number | New project |
| 8 | Database | Create task | Copy |
| 9 | Database | Create subtasks | If checked |
| 10 | User | View new task | Redirect |

---

## 4. Copy Rules

| Field | Behavior |
|-------|----------|
| id | Generate new |
| taskNumber | Generate new (per project) |
| projectId | Set to target project |
| parentId | null (for main), new parent ID (for subtask) |
| createdAt | NOW() |
| version | 1 (reset) |
| Other fields | Copy as-is |

---

## 5. Business Rules

| Rule | Mô tả |
|------|-------|
| BR-01 | Có thể copy sang project khác |
| BR-02 | Task number mới theo project đích |
| BR-03 | Subtasks được copy recursive nếu chọn |
| BR-04 | Cần quyền tasks.create ở project đích |

---

*Ngày tạo: 2026-01-15*
