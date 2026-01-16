# Activity Diagram: UC-07 - Xóa người dùng

> **Module**: User Management  
> **Use Case ID**: UC-07  
> **Tên Use Case**: Xóa người dùng  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép Administrator xóa người dùng khỏi hệ thống sau khi kiểm tra ràng buộc

### 1.2. Actors
- **Administrator**: Quản trị viên hệ thống
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: User và dữ liệu liên quan bị xóa
- **Failure**: Từ chối (không có quyền, tự xóa mình, có task được gán)

### 1.4. Các bước chính
1. Admin chọn user cần xóa
2. Admin xác nhận xóa
3. System kiểm tra ràng buộc
4. System xóa dữ liệu liên quan
5. System xóa user
6. Trả về kết quả

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-07: Xóa người dùng

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|Administrator|
start
:Chọn người dùng cần xóa từ danh sách;
:Nhấn nút "Xóa";

|System|
:Hiển thị dialog xác nhận:
"Bạn có chắc muốn xóa?";

|Administrator|
if (Xác nhận xóa?) then (yes)
  |System|
  :Kiểm tra quyền quản trị;
  note right
    session.user.isAdministrator
    Line 113, [id]/route.ts
  end note
  
  if (Là Administrator?) then (yes)
    :Kiểm tra không phải tự xóa mình;
    note right
      session.user.id === id
      Line 120
    end note
    
    if (Không phải tự xóa?) then (yes)
      :Đếm số task đang được gán cho user;
      note right
        prisma.task.count()
        where: assigneeId = id
        Line 125-127
      end note
      
      if (Không có task được gán?) then (yes)
        :Xóa ProjectMember (thành viên dự án);
        note right: Line 137
        
        :Xóa Watcher (theo dõi task);
        note right: Line 138
        
        :Xóa Notification (thông báo);
        note right: Line 139
        
        :Xóa User khỏi database;
        note right: Line 142
        
        :Trả về response: "Đã xóa user";
        
        |Administrator|
        :Hiển thị thông báo thành công;
        :Cập nhật danh sách người dùng;
      else (no)
        |System|
        :Trả về lỗi 400:
        "Không thể xóa user đang được 
        gán X công việc";
        
        |Administrator|
        :Hiển thị thông báo lỗi;
      endif
    else (no)
      |System|
      :Trả về lỗi 400:
      "Không thể tự xóa tài khoản của mình";
      
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
else (no)
  |System|
  :Đóng dialog xác nhận;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/users/[id]/route.ts` | `DELETE()` | 109-148 | API xóa user |
| `prisma.task.count()` | - | 125-127 | Kiểm tra task được gán |
| `prisma.projectMember.deleteMany()` | - | 137 | Xóa tư cách thành viên |
| `prisma.watcher.deleteMany()` | - | 138 | Xóa danh sách theo dõi |
| `prisma.notification.deleteMany()` | - | 139 | Xóa thông báo |
| `prisma.user.delete()` | - | 142 | Xóa user |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Admin Only | Chỉ admin mới được xóa user |
| BR-02 | No Self Delete | Không thể tự xóa tài khoản của mình |
| BR-03 | No Assigned Tasks | Không thể xóa user có task được gán |
| BR-04 | Cascade Delete | Xóa dữ liệu liên quan trước khi xóa user |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Tất cả if-else đều có endif
- [x] Các nhánh error merge về stop chung
- [x] Swimlanes phân chia rõ Admin/System
- [x] Activity đặt tên bằng động từ rõ ràng
- [x] Guard conditions cụ thể, có thể test

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
