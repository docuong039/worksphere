# Activity Diagram: UC-24 - Tạo công việc mới

> **Module**: Task Management  
> **Use Case ID**: UC-24  
> **Tên Use Case**: Tạo công việc mới  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép người dùng có quyền tạo công việc mới (task/subtask) trong dự án

### 1.2. Actors
- **User**: Thành viên dự án có quyền `tasks.create`
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Task được tạo, thông báo gửi cho assignee, audit log
- **Failure**: Từ chối (không có quyền, tracker/assignee invalid, vượt max depth)

### 1.4. Các bước chính
1. User nhấn "Tạo công việc"
2. System kiểm tra quyền tasks.create
3. User nhập thông tin
4. System validate tracker, assignee, parent
5. System tạo task với hierarchy
6. System gửi thông báo cho assignee
7. System cập nhật parent attributes

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-24: Tạo công việc mới

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Nhấn nút "Tạo công việc mới";

|System|
:Kiểm tra session đăng nhập;

if (Đã đăng nhập?) then (yes)
  :Kiểm tra quyền tasks.create
  trong dự án đích;
  note right
    checkProjectPermission()
    Line 199-203, route.ts
  end note
  
  if (Có quyền tạo task?) then (yes)
    :Hiển thị form tạo công việc;
    
    |User|
    :Nhập tiêu đề công việc;
    :Nhập mô tả (tùy chọn);
    :Chọn Tracker (loại công việc);
    :Chọn Status và Priority;
    :Chọn Assignee (người thực hiện);
    :Chọn Version/Milestone;
    :Chọn Parent Task (nếu là subtask);
    :Nhập ngày bắt đầu/đến hạn;
    :Nhấn nút "Tạo";
    
    |System|
    :Parse và validate dữ liệu
    bằng createTaskSchema;
    
    if (Dữ liệu hợp lệ?) then (yes)
      :Kiểm tra Tracker được enable cho dự án;
      note right
        projectTracker.findUnique()
        Line 211-213
      end note
      
      if (Tracker hợp lệ?) then (yes)
        if (Có Assignee?) then (yes)
          :Kiểm tra Assignee là member dự án;
          note right
            projectMember.findUnique()
            Line 240-244
          end note
          
          if (Assignee là member?) then (yes)
            if (Gán cho người khác?) then (yes)
              :Kiểm tra quyền canAssignToOther;
              note right
                role.canAssignToOther === true
                Line 258
              end note
              
              if (Có quyền gán cho người khác?) then (no)
                :Trả về lỗi 403:
                "Không có quyền giao việc cho người khác";
                
                |User|
                :Hiển thị thông báo lỗi;
                detach
              endif
            endif
          else (no)
            |System|
            :Trả về lỗi 400:
            "Người thực hiện không phải member";
            
            |User|
            :Hiển thị thông báo lỗi;
            detach
          endif
        endif
        
        |System|
        if (Có Parent Task?) then (yes)
          :Validate Parent và tính toán hierarchy;
          note right
            parent.level < 4 (max 5 cấp)
            level = parent.level + 1
            path = parent.path + "." + parent.id
            Line 269-282
          end note
          
          if (Parent hợp lệ?) then (no)
            :Trả về lỗi 400;
            
            |User|
            :Hiển thị thông báo lỗi;
            detach
          endif
        endif
        
        |System|
        :Tạo Task trong database;
        note right
          prisma.task.create()
          creatorId = session.user.id
          Line 285-307
        end note
        
        if (Assignee khác Creator?) then (yes)
          :Gửi thông báo cho Assignee;
          note right
            notifyTaskAssigned()
            Line 311-312
          end note
        endif
        
        :Ghi nhật ký hoạt động;
        note right
          logCreate('task', ...)
          Line 315-318
        end note
        
        if (Có Parent Task?) then (yes)
          :Cập nhật thuộc tính Parent (roll-up);
          note right
            updateParentAttributes()
            Line 321-323
          end note
        endif
        
        :Trả về response 201
        với thông tin task đã tạo;
        
        |User|
        :Hiển thị thông báo thành công;
        :Cập nhật danh sách công việc;
        
      else (no)
        |System|
        :Trả về lỗi 400:
        "Tracker không được kích hoạt";
        
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
    "Không có quyền thêm công việc";
    
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
| `src/app/api/tasks/route.ts` | `POST()` | 190-330 | API tạo task |
| `src/lib/permissions.ts` | `checkProjectPermission()` | - | Kiểm tra quyền trong dự án |
| `src/lib/notifications.ts` | `notifyTaskAssigned()` | - | Gửi thông báo |
| `src/lib/services/task-service.ts` | `updateParentAttributes()` | - | Cập nhật parent roll-up |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Permission Required | Cần quyền tasks.create trong dự án |
| BR-02 | Valid Tracker | Tracker phải được enable cho dự án |
| BR-03 | Assignee is Member | Người được gán phải là member dự án |
| BR-04 | canAssignToOther | Gán cho người khác cần quyền đặc biệt |
| BR-05 | Max Depth 5 | Hierarchy tối đa 5 cấp (level 0-4) |
| BR-06 | Same Project | Parent và child phải cùng dự án |
| BR-07 | Auto Notification | Tự động thông báo cho assignee mới |
| BR-08 | Roll-up Update | Tự động cập nhật parent attributes |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop chính
- [x] Dùng detach cho các lỗi nghiêm trọng cần thoát sớm
- [x] Tất cả if-else đều có endif
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng
- [x] Guard conditions cụ thể, có thể test

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
