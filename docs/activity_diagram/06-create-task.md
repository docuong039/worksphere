# Activity Diagram 06: Tạo công việc mới (UC-24)

> **Use Case**: UC-24 - Tạo công việc mới  
> **Module**: Task Management  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Cao |
| **Swimlanes** | User, System, Database |
| **Đặc điểm** | Auto-number, Tracker/Assignee validation, Hierarchy, Notifications |
| **Use Case tham chiếu** | [UC-24](../usecases/06-task-management.md) |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Tạo công việc mới (UC-24)

|User|
start
:Click "Tạo công việc";
:Nhập thông tin:
- Tiêu đề (bắt buộc)
- Mô tả
- Tracker, Status, Priority
- Assignee, Version
- Parent Task (optional)
- Start/Due Date
- Estimated Hours
- isPrivate;
:Click "Tạo";

|System|
:Check permission tasks.create;

if (Có quyền?) then (Không)
  :Hiển thị lỗi 403;
  :Message: "Bạn không có quyền thêm công việc vào dự án này";
  |User|
  stop
endif

:Validate required fields;

if (Tiêu đề rỗng?) then (Có)
  :Hiển thị lỗi validation;
  |User|
  stop
endif

' ========== VALIDATE TRACKER ==========
|Database|
:Check tracker enabled for project (ProjectTracker);

|System|
if (Tracker enabled?) then (Không)
  :Hiển thị lỗi;
  :Message: "Tracker này không được kích hoạt cho dự án hiện tại";
  |User|
  stop
endif

if (User là Admin?) then (Không)
  |Database|
  :Check tracker allowed for role (RoleTracker);
  
  |System|
  if (Tracker allowed?) then (Không)
    :Hiển thị lỗi;
    :Message: "Tracker không được hỗ trợ trong dự án này";
    |User|
    stop
  endif
endif

' ========== VALIDATE ASSIGNEE ==========
if (Có assigneeId?) then (Có)
  |Database|
  :Check assignee là member của project;
  
  |System|
  if (Là member?) then (Không)
    :Hiển thị lỗi;
    :Message: "Người thực hiện không phải là thành viên của dự án này";
    |User|
    stop
  endif
  
  if (Gán cho người khác?) then (Có)
    :Check role.canAssignToOther === true;
    
    if (Có quyền gán?) then (Không)
      :Hiển thị lỗi 403;
      :Message: "Bạn không có quyền giao việc cho người khác";
      |User|
      stop
    endif
  endif
endif

' ========== VALIDATE PARENT & HIERARCHY ==========
if (Có parentId?) then (Có)
  |Database|
  :Query parent task;
  
  |System|
  if (Parent tồn tại?) then (Không)
    :Hiển thị lỗi;
    :Message: "Không tìm thấy công việc cha";
    |User|
    stop
  endif
  
  if (Parent trong cùng project?) then (Không)
    :Hiển thị lỗi;
    :Message: "Công việc cha phải thuộc cùng dự án";
    |User|
    stop
  endif
  
  if (Parent level >= 4?) then (Có)
    :Hiển thị lỗi;
    :Message: "Không thể tạo công việc con quá 5 cấp";
    |User|
    stop
  endif
  
  :Calculate level = parent.level + 1;
  :Calculate path = parent.path + "." + parent.id;
endif

' ========== CREATE TASK ==========
|Database|
:INSERT Task record;
note right
  creatorId = session.user.id
  doneRatio = 0
  isPrivate = false (default)
  level, path = calculated
end note

:Get task ID;

' ========== NOTIFICATIONS ==========
|System|
if (assigneeId != creatorId?) then (Có)
  :Call notifyTaskAssigned();
  note right: Async notification
endif

' ========== UPDATE PARENT ==========
if (Có parentId?) then (Có)
  :Call updateParentAttributes();
  note right
    Recalculate parent's:
    - startDate (min of children)
    - dueDate (max of children)
    - doneRatio (avg of children)
  end note
  
  |Database|
  :UPDATE parent task;
endif

' ========== AUDIT LOG ==========
|Database|
:INSERT AuditLog;
note right
  action = "created"
  entityType = "task"
end note

|System|
:Trả về task mới với includes;

|User|
:Redirect đến task detail;
:Hiển thị thông báo thành công;

stop

@enduml
```

---

## 3. Mô tả các bước (Khớp với UC-24 Main Flow)

| # UC | # AD | Actor | Hành động | Ghi chú |
|------|------|-------|-----------|---------| 
| 1 | 1 | User | Click tạo công việc | Mở form |
| 2 | 2-3 | System | Check permission | tasks.create |
| 3 | 1 | System | Hiển thị form | Nhiều fields |
| 4 | 1 | User | Nhập và submit | Click Tạo |
| 5 | 4-5 | System | Validate tracker | ProjectTracker + RoleTracker |
| 6 | 6-7 | System | Validate assignee | Member + canAssignToOther |
| 7 | 8-11 | System | Validate parent & hierarchy | Level ≤ 4 |
| 8 | 12 | Database | Create task | INSERT |
| 9 | 13 | System | Send notification | If assignee != creator |
| 10 | 14 | Database | Write audit log | action=created |
| 11 | 15 | System | Update parent | If has parent |

---

## 4. Decision Points (Khớp với UC Exception Flows)

| # | Condition | True | False | UC Ref |
|---|-----------|------|-------|--------|
| D1 | Có quyền tasks.create? | Tiếp tục | Error 403 | E1 |
| D2 | Tracker enabled cho project? | Tiếp tục | Error | E2 |
| D3 | Tracker allowed cho role? (non-admin) | Tiếp tục | Error | E3 |
| D4 | Assignee là member? | Tiếp tục | Error | E4 |
| D5 | Có quyền gán người khác? | Tiếp tục | Error 403 | E5 |
| D6 | Parent tồn tại? | Tiếp tục | Error | E6 |
| D7 | Parent cùng project? | Tiếp tục | Error | E7 |
| D8 | Parent level < 4? | Tiếp tục | Error | E8 |

---

## 5. Business Rules (Khớp với UC-24)

| Rule | Mô tả | UC Ref |
|------|-------|--------|
| BR-01 | Cần quyền `tasks.create` | Tiền điều kiện |
| BR-02 | Tracker phải enabled trong ProjectTracker | Bước 5 |
| BR-03 | Non-admin: tracker phải có trong RoleTracker | Bước 5 |
| BR-04 | Assignee phải là member của project | Bước 6 |
| BR-05 | Gán người khác cần canAssignToOther = true | Bước 6 |
| BR-06 | Tối đa 5 cấp hierarchy (level 0-4) | Bước 7 |
| BR-07 | Subtask cập nhật parent attributes | Bước 11 |
| BR-08 | Notification cho assignee khác creator | Bước 9 |

---

*Cập nhật: 2026-01-16 - Đồng bộ hoàn toàn với UC-24*
