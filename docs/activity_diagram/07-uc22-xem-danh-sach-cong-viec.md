# Activity Diagram: UC-22 - Xem danh sách công việc

> **Module**: Task Management  
> **Use Case ID**: UC-22  
> **Tên Use Case**: Xem danh sách công việc  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép người dùng xem danh sách công việc với filter, search, pagination

### 1.2. Actors
- **User**: Thành viên dự án có quyền `tasks.view_project`
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Danh sách tasks với pagination và aggregations
- **Failure**: Danh sách rỗng hoặc lỗi quyền

### 1.4. Các bước chính
1. User truy cập trang danh sách
2. System xác định dự án được phép xem
3. System áp dụng bộ lọc
4. System truy vấn và trả về danh sách

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-22: Xem danh sách công việc

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Truy cập trang danh sách công việc;

|System|
:Kiểm tra session đăng nhập;

if (Đã đăng nhập?) then (yes)
  :Xác định danh sách dự án 
  user có quyền tasks.view_project;
  note right
    getAccessibleProjectIds()
    Line 31, route.ts
  end note
  
  if (Có chỉ định projectId cụ thể?) then (yes)
    :Kiểm tra quyền truy cập dự án;
    
    if (Có quyền hoặc là Admin?) then (yes)
      :Sử dụng projectId được chỉ định;
    else (no)
      :Trả về lỗi 403:
      "Không có quyền xem dự án này";
      
      |User|
      :Hiển thị thông báo từ chối;
      detach
    endif
  else (no)
    :Sử dụng tất cả dự án được phép;
  endif
  
  |System|
  if (Có dự án được phép hoặc là Admin?) then (yes)
    :Xây dựng bộ lọc private tasks;
    note right
      Admin: xem tất cả
      User: isPrivate=false 
      OR creatorId/assigneeId = userId
      Line 57-63
    end note
    
    :Áp dụng các bộ lọc từ query params;
    note right
      - statusId, priorityId, trackerId
      - assigneeId, creatorId
      - versionId, parentId
      - isClosed, search
      - startDateFrom/To, dueDateFrom/To
      - my, assignedToMe, createdByMe
      Line 66-128
    end note
    
    fork
      :Truy vấn danh sách tasks với includes;
      note right
        prisma.task.findMany()
        include: tracker, status, 
        priority, project, assignee...
        Line 132-160
      end note
    fork again
      :Đếm tổng số tasks;
      note right
        prisma.task.count()
        Line 161
      end note
    fork again
      :Tính tổng estimatedHours;
      note right
        prisma.task.aggregate()
        Line 162-165
      end note
    end fork
    
    :Trả về response với:
    - tasks
    - pagination (page, pageSize, total)
    - aggregations (totalHours);
    
    |User|
    :Hiển thị danh sách công việc;
    :Hiển thị thông tin phân trang;
    :Hiển thị tổng số giờ ước tính;
  else (no)
    |System|
    :Trả về danh sách rỗng
    với pagination = 0;
    
    |User|
    :Hiển thị thông báo:
    "Bạn chưa tham gia dự án nào";
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
| `src/app/api/tasks/route.ts` | `GET()` | 16-183 | API lấy danh sách tasks |
| `src/lib/permissions.ts` | `getAccessibleProjectIds()` | - | Lấy danh sách dự án được phép |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Permission View | Quyền tasks.view_project quyết định dự án nào được xem |
| BR-02 | Private Task | Task riêng tư chỉ hiện cho creator/assignee (trừ admin) |
| BR-03 | Max Page Size | Kích thước trang tối đa 100 tasks |
| BR-04 | Default Sort | Sắp xếp mặc định theo updatedAt desc |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop chính
- [x] Dùng detach cho lỗi quyền cần thoát sớm
- [x] Fork/Join cho truy vấn song song
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
