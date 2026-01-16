# Activity Diagram: UC-10 - Tạo dự án mới

> **Module**: Project Management  
> **Use Case ID**: UC-10  
> **Tên Use Case**: Tạo dự án mới  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép người dùng có quyền tạo dự án mới trong hệ thống

### 1.2. Actors
- **User**: Người dùng có quyền `projects.create` hoặc Administrator
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Dự án được tạo, creator thành Manager, tất cả Trackers được enable
- **Failure**: Từ chối (không có quyền, identifier trùng, validation lỗi)

### 1.4. Các bước chính
1. User nhấn "Tạo dự án mới"
2. System hiển thị form
3. User nhập thông tin
4. System validate và kiểm tra identifier unique
5. System tạo dự án + thêm creator làm Manager
6. System enable tất cả Trackers
7. System ghi audit log

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-10: Tạo dự án mới

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Nhấn nút "Tạo dự án mới";

|System|
:Kiểm tra session đăng nhập;

if (Đã đăng nhập?) then (yes)
  :Kiểm tra quyền tạo dự án;
  note right
    Admin: luôn có quyền
    User: cần projects.create
    Line 88-93, route.ts
  end note
  
  if (Có quyền tạo dự án?) then (yes)
    :Hiển thị form tạo dự án;
    note right
      - Tên (bắt buộc)
      - Identifier (bắt buộc)
      - Mô tả (tùy chọn)
      - Ngày bắt đầu/kết thúc
    end note
    
    |User|
    :Nhập tên dự án;
    :Nhập mã định danh (identifier);
    :Nhập mô tả (tùy chọn);
    :Chọn ngày bắt đầu/kết thúc;
    :Nhấn nút "Tạo";
    
    |System|
    :Parse và validate dữ liệu
    bằng createProjectSchema;
    
    if (Dữ liệu hợp lệ?) then (yes)
      :Kiểm tra identifier unique;
      note right
        prisma.project.findUnique()
        Line 99-101
      end note
      
      if (Identifier chưa tồn tại?) then (yes)
        :Tìm vai trò Manager trong hệ thống;
        note right
          prisma.role.findFirst()
          where: name = 'Manager'
          Line 108-110
        end note
        
        :Tạo dự án mới;
        :Thêm creator làm member với role Manager;
        note right
          prisma.project.create()
          Line 113-144
        end note
        
        :Lấy danh sách tất cả Trackers;
        
        if (Có Trackers trong hệ thống?) then (yes)
          :Enable tất cả Trackers cho dự án;
          note right
            prisma.projectTracker.createMany()
            Line 149-155
          end note
        endif
        
        :Ghi nhật ký hoạt động;
        note right
          logCreate('project', ...)
          Line 158-161
        end note
        
        :Trả về response 201 
        với thông tin dự án;
        
        |User|
        :Hiển thị thông báo thành công;
        :Chuyển đến trang chi tiết dự án;
      else (no)
        |System|
        :Trả về lỗi 400:
        "Định danh dự án đã tồn tại";
        
        |User|
        :Hiển thị thông báo lỗi;
      endif
    else (no)
      |System|
      :Trả về lỗi validation;
      
      |User|
      :Hiển thị các lỗi validation;
    endif
  else (no)
    |System|
    :Trả về lỗi 403:
    "Không có quyền tạo dự án";
    
    |User|
    :Hiển thị thông báo từ chối;
  endif
else (no)
  |System|
  :Trả về lỗi 401: "Chưa đăng nhập";
  
  |User|
  :Redirect về trang login;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/projects/route.ts` | `POST()` | 78-166 | API tạo project |
| `src/app/api/projects/route.ts` | `checkPermission()` | 170-192 | Kiểm tra quyền |
| `src/lib/validations.ts` | `createProjectSchema` | - | Schema validation |
| `src/lib/audit-log.ts` | `logCreate()` | 158-161 | Ghi audit log |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Unique Identifier | Mã định danh phải là duy nhất |
| BR-02 | Identifier Format | Chỉ chứa chữ thường, số, dấu gạch ngang |
| BR-03 | Auto Manager | Người tạo tự động thành Manager |
| BR-04 | Auto Enable Trackers | Tất cả Trackers được enable cho dự án mới |
| BR-05 | Audit Logging | Mọi thao tác tạo được ghi log |
| BR-06 | Permission Check | Admin hoặc có quyền projects.create |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Tất cả if-else đều có endif
- [x] Tất cả nhánh merge về stop chung
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng
- [x] Guard conditions cụ thể, có thể test

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
