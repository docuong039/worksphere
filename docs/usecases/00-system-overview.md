# Use Case Diagram 0: Tổng quan Hệ thống (System Overview)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - System Overview |
| **Loại** | Overview (Tổng quan) |
| **Mô tả** | Sơ đồ tổng quát thể hiện toàn bộ hệ thống Worksphere với các Actors chính và 23 Subsystems/Packages chức năng |
| **Tổng số Use Cases** | 79 UC |
| **Tổng số Modules** | 23 Modules |

---

## 2. Actors (Tác nhân)

| Actor | Loại | Mô tả |
|-------|------|-------|
| **User** | Primary | Người dùng đã đăng nhập. Quyền được xác định bởi Role trong từng Project. Có thể có các vai trò: Developer, Tester, Manager, etc. |
| **Administrator** | Primary | Quản trị viên hệ thống (`isAdministrator = true`). Bypass tất cả permission checks, có toàn quyền quản lý hệ thống. |

---

## 3. Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome
skinparam backgroundColor #FEFEFE

' ===== TITLE =====
title Worksphere - Use Case Diagram: System Overview

' ===== ACTORS =====
actor "User" as User #3498DB
actor "Administrator" as Admin #E74C3C

' ===== SYSTEM BOUNDARY =====
rectangle "Worksphere System" as System #F8F9FA {
  
  ' --- Authentication & User ---
  package "Authentication" as PKG1 #E8F6FF {
    usecase "Đăng nhập" as UC_AUTH
  }
  
  package "User Management" as PKG2 #FFEBEE {
    usecase "Quản lý Người dùng" as UC_USER
  }
  
  ' --- Project Management ---
  package "Project Management" as PKG3 #E8F5E9 {
    usecase "Quản lý Dự án" as UC_PROJECT
  }
  
  package "Project Members" as PKG4 #E8F5E9 {
    usecase "Quản lý Thành viên" as UC_MEMBER
  }
  
  package "Versions" as PKG5 #E8F5E9 {
    usecase "Quản lý Phiên bản" as UC_VERSION
  }
  
  ' --- Task Management ---
  package "Task Management" as PKG6 #FFF3E0 {
    usecase "Quản lý Công việc" as UC_TASK
  }
  
  package "Comments" as PKG7 #FFF3E0 {
    usecase "Bình luận" as UC_COMMENT
  }
  
  package "Attachments" as PKG8 #FFF3E0 {
    usecase "File đính kèm" as UC_ATTACH
  }
  
  package "Watchers" as PKG9 #FFF3E0 {
    usecase "Theo dõi" as UC_WATCH
  }
  
  package "Task Copy" as PKG10 #FFF3E0 {
    usecase "Sao chép Công việc" as UC_COPY
  }
  
  ' --- Communication & Search ---
  package "Notifications" as PKG11 #F3E5F5 {
    usecase "Thông báo" as UC_NOTIFY
  }
  
  package "Global Search" as PKG12 #F3E5F5 {
    usecase "Tìm kiếm" as UC_SEARCH
  }
  
  package "Saved Queries" as PKG13 #F3E5F5 {
    usecase "Bộ lọc đã lưu" as UC_QUERY
  }
  
  ' --- Reporting ---
  package "Dashboard & Reports" as PKG14 #E0F7FA {
    usecase "Báo cáo" as UC_REPORT
  }
  
  package "Workload" as PKG16 #E0F7FA {
    usecase "Phân bổ Công việc" as UC_WORKLOAD
  }
  
  package "Activity Log" as PKG23 #E0F7FA {
    usecase "Nhật ký Hoạt động" as UC_ACTIVITY
  }
  
  ' --- Admin Configuration ---
  package "Trackers Config" as PKG15 #FCE4EC {
    usecase "Cấu hình Trackers" as UC_TRACKER
  }
  
  package "Statuses Config" as PKG17 #FCE4EC {
    usecase "Cấu hình Statuses" as UC_STATUS
  }
  
  package "Priorities Config" as PKG18 #FCE4EC {
    usecase "Cấu hình Priorities" as UC_PRIORITY
  }
  
  package "Roles Config" as PKG19 #FCE4EC {
    usecase "Cấu hình Roles" as UC_ROLE
  }
  
  package "Workflow Config" as PKG20 #FCE4EC {
    usecase "Cấu hình Workflow" as UC_WORKFLOW
  }
  
  ' --- Project Settings ---
  package "Project Issue Settings" as PKG21 #FFFDE7 {
    usecase "Cấu hình Issue Tracking" as UC_ISSUE_SETTING
  }
  
  package "Project Trackers" as PKG22 #FFFDE7 {
    usecase "Trackers Dự án" as UC_PROJ_TRACKER
  }
}

' ===== ASSOCIATIONS =====
' User associations
User --> UC_AUTH
User --> UC_PROJECT
User --> UC_MEMBER
User --> UC_VERSION
User --> UC_TASK
User --> UC_COMMENT
User --> UC_ATTACH
User --> UC_WATCH
User --> UC_COPY
User --> UC_NOTIFY
User --> UC_SEARCH
User --> UC_QUERY
User --> UC_REPORT
User --> UC_WORKLOAD
User --> UC_ACTIVITY
User --> UC_ISSUE_SETTING
User --> UC_PROJ_TRACKER

' Admin associations (all User associations + Admin-only)
Admin --> UC_AUTH
Admin --> UC_USER
Admin --> UC_PROJECT
Admin --> UC_TASK
Admin --> UC_REPORT
Admin --> UC_WORKLOAD
Admin --> UC_TRACKER
Admin --> UC_STATUS
Admin --> UC_PRIORITY
Admin --> UC_ROLE
Admin --> UC_WORKFLOW

' ===== NOTES =====
note right of Admin
  Administrator có:
  - Toàn quyền hệ thống
  - Bypass permission checks
  - isAdministrator = true
end note

note right of User
  User có quyền dựa trên:
  - Role được gán trong Project
  - Permissions của Role
  - Quyền đặc biệt (Creator)
end note

@enduml
```

---

## 4. Bảng mô tả các Subsystems

| # | Package | Tên Tiếng Việt | Số UC | Actors | Mô tả |
|---|---------|----------------|-------|--------|-------|
| 1 | Authentication | Xác thực | 3 | User | Đăng nhập, đăng xuất, xem thông tin tài khoản |
| 2 | User Management | Quản lý Người dùng | 4 | Admin | CRUD người dùng hệ thống |
| 3 | Project Management | Quản lý Dự án | 5 | User, Admin | CRUD dự án |
| 4 | Project Members | Quản lý Thành viên | 4 | User | Thêm/xóa/sửa thành viên dự án |
| 5 | Versions | Quản lý Phiên bản | 5 | User | CRUD phiên bản, xem Roadmap |
| 6 | Task Management | Quản lý Công việc | 7 | User | CRUD công việc, gán, đổi trạng thái |
| 7 | Comments | Bình luận | 4 | User | CRUD bình luận trên task |
| 8 | Attachments | File đính kèm | 4 | User | Upload/download/xóa file |
| 9 | Watchers | Theo dõi | 4 | User | Đăng ký/hủy theo dõi task |
| 10 | Task Copy | Sao chép | 1 | User | Sao chép task sang dự án khác |
| 11 | Notifications | Thông báo | 2 | User | Xem và đánh dấu thông báo |
| 12 | Global Search | Tìm kiếm | 1 | User | Tìm kiếm toàn hệ thống |
| 13 | Saved Queries | Bộ lọc đã lưu | 4 | User | Lưu/chia sẻ bộ lọc |
| 14 | Dashboard & Reports | Báo cáo | 5 | User, Admin | Dashboard, thống kê, xuất CSV |
| 15 | Trackers Config | Cấu hình Trackers | 4 | Admin | CRUD loại công việc |
| 16 | Workload | Phân bổ Công việc | 4 | User, Admin | Xem phân bổ giờ làm |
| 17 | Statuses Config | Cấu hình Statuses | 4 | Admin | CRUD trạng thái |
| 18 | Priorities Config | Cấu hình Priorities | 4 | Admin | CRUD độ ưu tiên |
| 19 | Roles Config | Cấu hình Roles | 4 | Admin | CRUD vai trò |
| 20 | Workflow Config | Cấu hình Workflow | 2 | Admin | Định nghĩa chuyển đổi trạng thái |
| 21 | Project Issue Settings | Cấu hình Issue | 1 | User (PM) | Cấu hình quy tắc task trong dự án |
| 22 | Project Trackers | Trackers Dự án | 2 | User (PM) | Chọn loại công việc cho dự án |
| 23 | Activity Log | Nhật ký | 1 | User | Xem lịch sử hoạt động |

---

## 5. Ma trận Actor - Subsystem

| Subsystem | User | Administrator |
|-----------|:----:|:-------------:|
| Authentication | ✅ | ✅ |
| User Management | ❌ | ✅ |
| Project Management | ✅ | ✅ |
| Project Members | ✅ | ✅ |
| Versions | ✅ | ✅ |
| Task Management | ✅ | ✅ |
| Comments | ✅ | ✅ |
| Attachments | ✅ | ✅ |
| Watchers | ✅ | ✅ |
| Task Copy | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Global Search | ✅ | ✅ |
| Saved Queries | ✅ | ✅ |
| Dashboard & Reports | ✅ | ✅ |
| Trackers Config | ❌ | ✅ |
| Workload | ✅ | ✅ |
| Statuses Config | ❌ | ✅ |
| Priorities Config | ❌ | ✅ |
| Roles Config | ❌ | ✅ |
| Workflow Config | ❌ | ✅ |
| Project Issue Settings | ✅ | ✅ |
| Project Trackers | ✅ | ✅ |
| Activity Log | ✅ | ✅ |

---

## 6. Ghi chú quan trọng

### 6.1 Hệ thống phân quyền RBAC động

```
┌─────────────────────────────────────────────────────────┐
│                    RBAC Architecture                    │
├─────────────────────────────────────────────────────────┤
│  User ──► ProjectMember ──► Role ──► Permissions        │
│                                                         │
│  • User có Role khác nhau trong các Project khác nhau   │
│  • Role chứa tập Permissions                            │
│  • Permission kiểm tra tại runtime                      │
│  • Administrator bypass tất cả                          │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Quy ước màu sắc trong sơ đồ

| Màu | Ý nghĩa |
|-----|---------|
| 🔵 Xanh dương (#E8F6FF) | Authentication |
| 🔴 Đỏ nhạt (#FFEBEE) | Admin-only modules |
| 🟢 Xanh lá (#E8F5E9) | Project Management |
| 🟠 Cam (#FFF3E0) | Task-related modules |
| 🟣 Tím (#F3E5F5) | Communication & Search |
| 🔵 Cyan (#E0F7FA) | Reporting & Analytics |
| 🟡 Vàng (#FFFDE7) | Project Settings |

---

## 7. Validation Checklist

- [x] Mọi Use Case đều nằm trong System Boundary
- [x] Mọi Actor đều nằm ngoài System Boundary
- [x] Tên Use Case là động từ, không phải danh từ
- [x] Không có Use Case "lơ lửng" (không có Actor tương tác)
- [x] Phân biệt rõ Primary và Secondary Actor
- [x] Sử dụng Package để nhóm các UC liên quan

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-15*
