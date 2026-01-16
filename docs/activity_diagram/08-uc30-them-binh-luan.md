# Activity Diagram: UC-30 - Thêm bình luận

> **Module**: Comments  
> **Use Case ID**: UC-30  
> **Tên Use Case**: Thêm bình luận  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép thành viên dự án thêm bình luận vào công việc

### 1.2. Actors
- **User**: Thành viên của dự án chứa công việc
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Comment được tạo, task được cập nhật, watchers nhận thông báo
- **Failure**: Từ chối (không có quyền, task không tồn tại)

### 1.4. Các bước chính
1. User nhập nội dung bình luận
2. User gửi bình luận
3. System validate và tạo comment
4. System cập nhật task.updatedAt
5. System gửi thông báo cho watchers

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-30: Thêm bình luận

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Mở chi tiết công việc;
:Nhập nội dung bình luận;
:Nhấn nút "Gửi" hoặc Enter;

|System|
:Kiểm tra session đăng nhập;

if (Đã đăng nhập?) then (yes)
  :Truy vấn Task và kiểm tra tồn tại;
  
  if (Task tồn tại?) then (yes)
    :Kiểm tra user là member của dự án;
    
    if (Là member dự án?) then (yes)
      :Validate nội dung bình luận;
      note right
        content không được trống
        Zod validation
      end note
      
      if (Nội dung hợp lệ?) then (yes)
        :Tạo Comment trong database;
        note right
          prisma.comment.create()
          userId = session.user.id
        end note
        
        :Cập nhật task.updatedAt;
        note right
          Tự động đánh dấu
          task được cập nhật
        end note
        
        :Lấy danh sách watchers của task;
        
        if (Có watchers?) then (yes)
          :Gửi thông báo cho watchers;
          note right
            notifyCommentAdded()
            Loại trừ người comment
          end note
        endif
        
        :Trả về response với comment đã tạo;
        
        |User|
        :Hiển thị bình luận mới trong danh sách;
        :Xóa nội dung trong ô nhập;
      else (no)
        |System|
        :Trả về lỗi validation:
        "Nội dung không được trống";
        
        |User|
        :Hiển thị thông báo lỗi;
      endif
    else (no)
      |System|
      :Trả về lỗi 403:
      "Không phải thành viên dự án";
      
      |User|
      :Hiển thị thông báo từ chối;
    endif
  else (no)
    |System|
    :Trả về lỗi 404:
    "Công việc không tồn tại";
    
    |User|
    :Hiển thị thông báo lỗi;
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
| `src/app/api/tasks/[id]/comments/route.ts` | `POST()` | - | API tạo comment |
| `src/lib/notifications.ts` | `notifyCommentAdded()` | - | Gửi thông báo cho watchers |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Member Only | Chỉ member dự án mới được comment |
| BR-02 | Auto Update | Task.updatedAt được cập nhật khi có comment mới |
| BR-03 | Notify Watchers | Tự động thông báo cho watchers (trừ người comment) |
| BR-04 | Non-Empty | Nội dung comment không được trống |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Tất cả if-else đều có endif
- [x] Các nhánh error merge về stop chung
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
