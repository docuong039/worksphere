# Activity Diagram 15: Cấu hình Workflow Transition (UC-68)

> **Use Case**: UC-68 - Cập nhật Workflow  
> **Module**: Workflow Configuration  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | Administrator |
| **Độ phức tạp** | Cao |
| **Swimlanes** | Admin, System, Database |
| **Đặc điểm** | Delete-then-Create pattern, Matrix UI |
| **Use Case tham chiếu** | [UC-67](../usecases/19-workflow-management.md), [UC-68](../usecases/19-workflow-management.md) |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Cấu hình Workflow Transition (UC-67, UC-68)

|Admin|
start
:Truy cập /settings/workflow;

|System|
|Database|
fork
  :Query all Trackers (orderBy position);
fork again
  :Query all Statuses (orderBy position);
fork again
  :Query all Roles (orderBy name);
end fork

|System|
:Hiển thị dropdowns: Tracker, Role;

|Admin|
:Chọn Tracker (Bug, Feature...);
:Chọn Role (hoặc "All Roles" = null);

|Database|
:Query WorkflowTransitions;
note right
  WHERE trackerId = selected
  AND roleId = selected (hoặc NULL)
end note

|System|
:Build matrix NxN (N = số statuses);
:Check cells: transition exists = checked;
:Hiển thị matrix;
note right
  Row = From Status
  Col = To Status
  ✓ = Transition allowed
end note

|Admin|
:Check/Uncheck các ô trong matrix;
:Click "Lưu";

|System|
if (User là Admin?) then (Không)
  :Hiển thị lỗi 403 "Không có quyền truy cập";
  |Admin|
  stop
endif

if (trackerId rỗng?) then (Có)
  :Hiển thị lỗi 400 "Tracker ID là bắt buộc";
  |Admin|
  stop
endif

if (transitions không phải array?) then (Có)
  :Hiển thị lỗi 400 "Transitions phải là một mảng";
  |Admin|
  stop
endif

' ========== DELETE-CREATE PATTERN ==========
|Database|
:DELETE tất cả transitions cũ;
note right #FFAAAA
  DELETE FROM WorkflowTransition
  WHERE trackerId = input.trackerId
  AND roleId = input.roleId || NULL
end note

|System|
:Filter transitions có allowed = true;
:Map to new records;

|Database|
if (Có transitions để tạo?) then (Có)
  :createMany(newTransitions);
  note right #AAFFAA
    INSERT INTO WorkflowTransition
    (trackerId, roleId, fromStatusId, toStatusId)
    VALUES ...
  end note
endif

|System|
:Trả về { message, count };

|Admin|
:Refresh matrix;
:Hiển thị: "Đã cập nhật workflow (N transitions)";

stop

@enduml
```

---

## 3. Workflow Matrix Example

```
Tracker: Bug    Role: Developer

             │ New │ InProg │ Resolved │ Closed │
─────────────┼─────┼────────┼──────────┼────────┤
New          │  -  │   ✓    │    ✓     │        │
InProgress   │     │   -    │    ✓     │        │
Resolved     │     │   ✓    │    -     │        │
Closed       │     │        │          │   -    │

✓ = Transition được phép (record exists)
(empty) = Không được phép
- = Same status (N/A)
```

---

## 4. Update Pattern (Khớp với UC-68)

**Delete-then-Create** (không phải incremental update):

```
POST /api/workflow
{
  "trackerId": "xxx",
  "roleId": "yyy" (hoặc null = all roles),
  "transitions": [
    { "fromStatusId": "s1", "toStatusId": "s2", "allowed": true },
    { "fromStatusId": "s1", "toStatusId": "s3", "allowed": true },
    { "fromStatusId": "s2", "toStatusId": "s3", "allowed": false },
    ...
  ]
}

Step 1: DELETE ALL WHERE trackerId=xxx AND roleId=yyy
Step 2: INSERT only where allowed=true
```

---

## 5. Decision Points (Khớp với UC Exception Flows)

| # | Condition | True | False | UC Ref |
|---|-----------|------|-------|--------|
| D1 | User là Admin? | Tiếp tục | Error 403 | E1 |
| D2 | trackerId có? | Tiếp tục | Error 400 | E2 |
| D3 | transitions là array? | Tiếp tục | Error 400 | E3 |

---

## 6. Business Rules (Khớp với UC-68)

| Rule | Mô tả | UC Ref |
|------|-------|--------|
| BR-01 | Chỉ Admin được cập nhật workflow | BR-02 |
| BR-02 | roleId = NULL áp dụng cho tất cả roles | BR-01 |
| BR-03 | trackerId là bắt buộc | BR-03 |
| BR-04 | Delete-Create pattern đảm bảo idempotent | BR-04 |
| BR-05 | Batch insert với createMany | BR-05 |

---

## 7. Impact

Khi workflow được cấu hình:
- **UC-26** (Thay đổi trạng thái) validate theo transitions này
- User chỉ thấy dropdown status dựa trên allowed transitions
- Admin bypass workflow validation

---

*Cập nhật: 2026-01-16 - Đồng bộ hoàn toàn với UC-67, UC-68*
