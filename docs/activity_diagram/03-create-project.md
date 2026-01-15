# Activity Diagram 03: Tạo dự án mới (UC-10)

> **Use Case**: UC-10 - Tạo dự án mới  
> **Module**: Project Management  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Tạo dự án mới (UC-10)

|User|
start
:Click "Tạo dự án mới";
:Nhập thông tin:
- Name
- Identifier
- Description
- Start Date
- End Date;
:Click "Tạo";

|System|
:Check permission projects.create;

if (Có quyền?) then (Không)
  :Hiển thị lỗi 403 Forbidden;
  |User|
  stop
endif

:Validate required fields;

if (Thiếu field bắt buộc?) then (Có)
  :Hiển thị validation errors;
  |User|
  stop
endif

:Validate identifier format;
note right
  - lowercase only
  - alphanumeric + dashes
  - no spaces
end note

if (Format hợp lệ?) then (Không)
  :Hiển thị lỗi "Mã định danh không hợp lệ";
  |User|
  stop
endif

|Database|
:Check identifier unique;

|System|
if (Identifier đã tồn tại?) then (Có)
  :Hiển thị lỗi "Mã dự án đã tồn tại";
  |User|
  stop
endif

|Database|
:INSERT Project record;
:Get project ID;

:INSERT ProjectMember;
note right
  userId = creator
  roleId = Manager role
end note

|System|
:Trả về project mới;

|User|
:Redirect đến project detail;
:Hiển thị thông báo thành công;

stop

@enduml
```

---

## 3. Mô tả các bước

| # | Actor | Hành động | Ghi chú |
|---|-------|-----------|---------|
| 1 | User | Click tạo dự án | Button/Link |
| 2 | User | Nhập thông tin | Form fields |
| 3 | System | Check permission | projects.create |
| 4 | System | Validate required | name, identifier |
| 5 | System | Validate identifier format | Regex: ^[a-z0-9-]+$ |
| 6 | Database | Check unique | identifier |
| 7 | Database | Create project | INSERT |
| 8 | Database | Create member | Auto-assign creator |
| 9 | User | View project | Redirect |

---

## 4. Business Rules

| Rule | Mô tả |
|------|-------|
| BR-01 | Identifier phải unique |
| BR-02 | Identifier: lowercase, alphanumeric, dashes |
| BR-03 | Creator tự động thành member với role Manager |

---

*Ngày tạo: 2026-01-15*
