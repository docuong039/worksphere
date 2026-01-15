# Use Case Diagram 17: Cấu hình Statuses (Admin)

> **Module**: Statuses Configuration | **Số UC**: 4 | **Ngày**: 2026-01-15

---

## 1. Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| **Administrator** | Primary | Quản trị viên hệ thống |

---

## 2. Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

title Worksphere - UC Diagram: Statuses Configuration

actor "Administrator" as Admin #E74C3C

rectangle "Worksphere System" {
  package "Statuses Configuration" #FCE4EC {
    usecase "UC-62: Xem danh sách Status" as UC62
    usecase "UC-63: Tạo Status" as UC63
    usecase "UC-64: Cập nhật Status" as UC64
    usecase "UC-65: Xóa Status" as UC65
  }
  
  usecase "Check Usage" as UC_USE <<internal>>
}

Admin --> UC62
Admin --> UC63
Admin --> UC64
Admin --> UC65

UC65 .> UC_USE : <<include>>

note right of UC63
  Fields:
  - name
  - isClosed
  - defaultDoneRatio
end note

note right of UC65
  Không xóa được nếu
  có task đang sử dụng
end note
@enduml
```

---

## 3. Bảng mô tả Use Cases

| UC ID | Tên Use Case | Actor | Mô tả |
|-------|--------------|-------|-------|
| UC-62 | Xem danh sách Status | Admin | Xem tất cả statuses |
| UC-63 | Tạo Status | Admin | Tạo status với name, isClosed, defaultDoneRatio |
| UC-64 | Cập nhật Status | Admin | Chỉnh sửa status |
| UC-65 | Xóa Status | Admin | Xóa status (chỉ khi không có task dùng) |

---

## 4. Luồng sự kiện - UC-63: Tạo Status

**Tiền điều kiện:** User là Administrator

**Luồng chính:**
1. Admin vào Settings → Statuses
2. Admin click "Thêm Status"
3. Nhập: name, isClosed (checkbox), defaultDoneRatio (0-100)
4. Submit
5. Hệ thống tạo Status record
6. Refresh danh sách

**Hậu điều kiện:** Status mới được tạo

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | isClosed = true nghĩa là task đã hoàn thành |
| BR-02 | defaultDoneRatio tự động set khi task chuyển sang status này |
| BR-03 | Không thể xóa status đang có task sử dụng |

---

*Ngày tạo: 2026-01-15*
