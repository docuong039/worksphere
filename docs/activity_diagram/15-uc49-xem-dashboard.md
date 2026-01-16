# Activity Diagram: UC-49 - Xem Dashboard

> **Module**: Dashboard & Reports  
> **Use Case ID**: UC-49  
> **Tên Use Case**: Xem Dashboard  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép người dùng xem tổng quan: tasks được gán, quá hạn, sắp đến hạn, hoạt động gần đây

### 1.2. Actors
- **User**: Người dùng đã đăng nhập
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Hiển thị dashboard với các widgets thống kê

### 1.4. Các bước chính
1. User truy cập Dashboard
2. System truy vấn song song các dữ liệu
3. System trả về dữ liệu cho các widgets
4. User xem thông tin tổng hợp

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-49: Xem Dashboard

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Truy cập trang Dashboard;

|System|
:Kiểm tra session đăng nhập;

if (Đã đăng nhập?) then (yes)
  :Xác định userId và isAdministrator;
  
  fork
    :Đếm tasks được gán cho user;
    note right
      assigneeId = userId
      status.isClosed = false
    end note
  fork again
    :Đếm tasks quá hạn;
    note right
      assigneeId = userId
      dueDate < today
      status.isClosed = false
    end note
  fork again
    :Đếm tasks sắp đến hạn (7 ngày);
    note right
      assigneeId = userId
      dueDate <= today + 7
      status.isClosed = false
    end note
  fork again
    :Lấy hoạt động gần đây;
    note right
      AuditLog + Activities
      Giới hạn 10 items
    end note
  fork again
    :Thống kê theo status;
    note right
      Group by status
      Count tasks per status
    end note
  fork again
    :Lấy danh sách dự án user tham gia;
  end fork
  
  :Tổng hợp dữ liệu dashboard;
  
  :Trả về response với:
  - myTasks count
  - overdueTasks count
  - upcomingTasks count
  - recentActivities
  - statusStats
  - projects;
  
  |User|
  :Hiển thị widget "Công việc của tôi";
  :Hiển thị widget "Quá hạn";
  :Hiển thị widget "Sắp đến hạn";
  :Hiển thị chart thống kê theo status;
  :Hiển thị timeline hoạt động gần đây;
  :Hiển thị danh sách dự án;
else (no)
  |System|
  :Redirect về trang login;
  
  |User|
  :Hiển thị trang đăng nhập;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/dashboard/route.ts` | `GET()` | - | API dashboard data |
| `src/app/(dashboard)/dashboard/page.tsx` | - | - | Dashboard page component |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Authenticated Only | Phải đăng nhập mới xem được |
| BR-02 | User Scope | Chỉ hiện tasks được gán cho mình |
| BR-03 | Overdue Definition | Quá hạn = dueDate < today && chưa đóng |
| BR-04 | Upcoming 7 Days | Sắp đến hạn = dueDate trong 7 ngày tới |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Fork/Join cho truy vấn song song
- [x] Tất cả if-else đều có endif
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
