# Activity Diagram: UC-75 - Cấu hình Workflow Transition

> **Module**: Workflow Management  
> **Use Case ID**: UC-75  
> **Tên Use Case**: Cấu hình Transition  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép Administrator định nghĩa chuyển đổi trạng thái cho (tracker, role)

### 1.2. Actors
- **Administrator**: Quản trị viên hệ thống
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Workflow transitions được lưu
- **Failure**: Từ chối nếu không phải Admin

### 1.4. Các bước chính
1. Admin chọn tracker và role
2. Admin tích chọn transitions được phép
3. System lưu cấu hình

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-75: Cấu hình Workflow Transition

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|Administrator|
start
:Truy cập trang quản lý Workflow;

|System|
:Load danh sách Trackers;
:Load danh sách Roles;
:Load danh sách Statuses;

|Administrator|
:Chọn Tracker cần cấu hình;
:Chọn Role áp dụng (hoặc "All Roles");

|System|
:Hiển thị ma trận transitions;
note right
  Ma trận: 
  Hàng = From Status
  Cột = To Status
  Cell = Checkbox allowed
end note

:Load transitions hiện tại;
:Đánh dấu các transitions đã được cho phép;

|Administrator|
:Tích/bỏ tích các ô trong ma trận;
note right
  Quyết định từ status nào
  có thể chuyển sang status nào
end note

:Nhấn nút "Lưu";

|System|
:Kiểm tra quyền quản trị;

if (Là Administrator?) then (yes)
  :Xóa transitions cũ của (tracker, role);
  note right
    prisma.workflowTransition.deleteMany()
    where: trackerId, roleId
  end note
  
  :Lấy danh sách transitions mới từ request;
  
  if (Có transitions?) then (yes)
    :Tạo WorkflowTransition cho mỗi allowed pair;
    note right
      prisma.workflowTransition.createMany()
      trackerId, roleId (nullable),
      fromStatusId, toStatusId
    end note
  endif
  
  :Trả về response thành công;
  
  |Administrator|
  :Hiển thị thông báo thành công;
else (no)
  |System|
  :Trả về lỗi 403:
  "Không có quyền truy cập";
  
  |Administrator|
  :Hiển thị thông báo từ chối;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/workflows/route.ts` | `POST()` | - | API lưu workflow |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Admin Only | Chỉ Admin mới được cấu hình workflow |
| BR-02 | Tracker Based | Workflow áp dụng theo từng Tracker |
| BR-03 | Role Based | Có thể áp dụng cho role cụ thể hoặc tất cả |
| BR-04 | Replace All | Xóa cấu hình cũ trước khi lưu mới |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Tất cả if-else đều có endif
- [x] Swimlanes phân chia rõ Admin/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
