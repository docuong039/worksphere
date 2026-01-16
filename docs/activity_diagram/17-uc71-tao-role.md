# Activity Diagram: UC-71 - Tạo Role mới

> **Module**: Role Management  
> **Use Case ID**: UC-71  
> **Tên Use Case**: Tạo Role  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép Administrator tạo vai trò mới với tên, quyền gán và permissions

### 1.2. Actors
- **Administrator**: Quản trị viên hệ thống
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Role được tạo với permissions được gán
- **Failure**: Từ chối nếu không phải Admin

### 1.4. Các bước chính
1. Admin nhấn "Tạo vai trò"
2. Admin nhập tên và chọn permissions
3. System tạo role và gán permissions

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-71: Tạo Role mới

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|Administrator|
start
:Truy cập trang quản lý Roles;
:Nhấn nút "Tạo vai trò mới";

|System|
:Hiển thị form tạo vai trò;
:Load danh sách Permissions có sẵn;

|Administrator|
:Nhập tên vai trò;
:Chọn có thể gán vào tasks (assignable);
:Chọn có thể gán cho người khác (canAssignToOther);
:Tích chọn các Permissions cần gán;
:Nhấn nút "Tạo";

|System|
:Kiểm tra quyền quản trị;

if (Là Administrator?) then (yes)
  :Validate dữ liệu đầu vào;
  
  if (Dữ liệu hợp lệ?) then (yes)
    :Tạo Role mới;
    note right
      prisma.role.create()
      name, assignable, canAssignToOther
    end note
    
    if (Có permissions được chọn?) then (yes)
      :Tạo RolePermission cho mỗi permission;
      note right
        prisma.rolePermission.createMany()
        roleId, permissionId
      end note
    endif
    
    :Trả về role đã tạo;
    
    |Administrator|
    :Hiển thị thông báo thành công;
    :Cập nhật danh sách vai trò;
  else (no)
    |System|
    :Trả về lỗi validation:
    "Tên vai trò không được trống";
    
    |Administrator|
    :Hiển thị thông báo lỗi;
  endif
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
| `src/app/api/roles/route.ts` | `POST()` | - | API tạo role |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Admin Only | Chỉ Admin mới được tạo role |
| BR-02 | Name Required | Tên vai trò bắt buộc |
| BR-03 | Assignable | Quyết định role có thể gán vào tasks |
| BR-04 | canAssignToOther | Cho phép gán task cho người khác |

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
