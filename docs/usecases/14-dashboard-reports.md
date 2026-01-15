# Use Case Diagram 14: Dashboard & Báo cáo (Reports)

> **Module**: Dashboard & Reports | **Số UC**: 5 | **Ngày**: 2026-01-15

---

## 1. Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| **User** | Primary | Người dùng đã đăng nhập |
| **Administrator** | Primary | Admin có quyền xem báo cáo theo user |

---

## 2. Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

title Worksphere - UC Diagram: Dashboard & Reports

actor "User" as User #3498DB
actor "Administrator" as Admin #E74C3C

rectangle "Worksphere System" {
  package "Dashboard & Reports" #E0F7FA {
    usecase "UC-49: Xem Dashboard" as UC49
    usecase "UC-50: Xem báo cáo tổng hợp" as UC50
    usecase "UC-51: Xem báo cáo theo dự án" as UC51
    usecase "UC-52: Xem báo cáo theo người dùng" as UC52
    usecase "UC-53: Xuất dữ liệu CSV" as UC53
  }
  
  usecase "Generate PDF" as UC_PDF <<internal>>
}

User --> UC49
User --> UC50
User --> UC51
User --> UC53

Admin --> UC52

UC53 ..> UC_PDF : <<extend>>

note right of UC49
  Hiển thị:
  - Tasks assigned to me
  - Overdue tasks
  - Upcoming deadlines
end note

note right of UC52
  Chỉ Admin
  mới được xem
end note
@enduml
```

---

## 3. Bảng mô tả Use Cases

| UC ID | Tên Use Case | Actor | Mô tả |
|-------|--------------|-------|-------|
| UC-49 | Xem Dashboard | User | Tổng quan: tasks, overdue, upcoming, recent activity |
| UC-50 | Xem báo cáo tổng hợp | User | Thống kê: tổng projects, tasks, % hoàn thành |
| UC-51 | Xem báo cáo theo dự án | User | Thống kê từng project |
| UC-52 | Xem báo cáo theo người dùng | Admin | Thống kê theo từng user |
| UC-53 | Xuất dữ liệu CSV | User | Export tasks ra CSV/PDF |

---

## 4. Luồng sự kiện - UC-49: Xem Dashboard

**Tiền điều kiện:** User đã đăng nhập

**Luồng chính:**
1. User truy cập Dashboard (`/`)
2. Hệ thống query:
   - Tasks assigned to me (open)
   - Overdue tasks
   - Tasks due within 7 days
   - Recent activity
   - Statistics (by status, by project)
3. Hiển thị cards và charts

**Hậu điều kiện:** Dashboard được hiển thị

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | Dashboard chỉ hiển thị data của user |
| BR-02 | Admin thấy thêm system-wide stats |
| BR-03 | Báo cáo theo user chỉ Admin được xem |

---

*Ngày tạo: 2026-01-15*
