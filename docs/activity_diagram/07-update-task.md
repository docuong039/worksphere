# Activity Diagram 07: Cập nhật công việc (UC-25)

> **Use Case**: UC-25 - Cập nhật công việc  
> **Module**: Task Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |
| **Đặc điểm** | Optimistic Locking, Update parent, Notify watchers |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Cập nhật công việc (UC-25)

|User|
start
:Mở chi tiết công việc;
:Chỉnh sửa các trường;
:Click "Lưu";

|System|
:Get current user's role trong project;
:Check permission;

if (tasks.edit_any?) then (Có)
  :Cho phép edit;
else (Không)
  if (tasks.edit_own AND là creator?) then (Có)
    :Cho phép edit;
  else (Không)
    :Hiển thị lỗi 403 Forbidden;
    |User|
    stop
  endif
endif

|Database|
:Get task hiện tại;
:Get current version;

|System|
:So sánh version từ client;

if (Version match?) then (Không)
  :Hiển thị lỗi "Conflict - Dữ liệu đã thay đổi";
  note right
    Optimistic Locking failed
    Yêu cầu refresh
  end note
  |User|
  stop
endif

:Validate dữ liệu mới;

if (Dữ liệu hợp lệ?) then (Không)
  :Hiển thị validation errors;
  |User|
  stop
endif

|Database|
:UPDATE Task SET ... version = version + 1;

|System|
if (Task có parentId?) then (Có)
  :Gọi updateParentAttributes();
  
  |Database|
  :UPDATE parent task;
endif

|Database|
:INSERT AuditLog;
note right
  Ghi nhận các thay đổi
  oldValue, newValue
end note

|System|
:Get watchers;

fork
  :Create Notification cho mỗi watcher;
fork again
  :Trả về task updated;
end fork

|User|
:Hiển thị task đã cập nhật;
:Hiển thị thông báo thành công;

stop

@enduml
```

---

## 3. Optimistic Locking Flow

```
Client gửi: { id, data, version: 5 }
                    ↓
Server check: SELECT version FROM Task WHERE id = ?
                    ↓
            version = 5? ──→ UPDATE ... version = 6
                    ↓
            version ≠ 5? ──→ Return 409 Conflict
```

---

## 4. Permission Matrix

| Quyền | Điều kiện | Kết quả |
|-------|-----------|---------|
| tasks.edit_any | Có quyền | Cho phép |
| tasks.edit_own | Là creator | Cho phép |
| Không có quyền | - | 403 Forbidden |

---

## 5. Business Rules

| Rule | Mô tả |
|------|-------|
| BR-01 | Optimistic locking bằng version field |
| BR-02 | Version tự động tăng khi update |
| BR-03 | Update subtask → Recalculate parent |
| BR-04 | Notify watchers khi có thay đổi |

---

*Ngày tạo: 2026-01-15*
