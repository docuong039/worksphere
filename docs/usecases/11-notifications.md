# Use Case Diagram 11: Thông báo (Notifications)

> **Module**: Notifications | **Số UC**: 2 | **Ngày**: 2026-01-15

---

## 1. Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| **User** | Primary | Người dùng đã đăng nhập |

---

## 2. Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

title Worksphere - UC Diagram: Notifications

actor "User" as User #3498DB

rectangle "Worksphere System" {
  package "Notifications" #F3E5F5 {
    usecase "UC-42: Xem danh sách thông báo" as UC42
    usecase "UC-43: Đánh dấu đã đọc" as UC43
  }
  
  usecase "Count Unread" as UC_COUNT <<internal>>
}

User --> UC42
User --> UC43

UC42 .> UC_COUNT : <<include>>

note right of UC42
  Có thể lọc:
  - Tất cả
  - Chưa đọc
end note

note right of UC43
  Đánh dấu:
  - Một notification
  - Tất cả
end note
@enduml
```

---

## 3. Bảng mô tả Use Cases

| UC ID | Tên Use Case | Actor | Mô tả |
|-------|--------------|-------|-------|
| UC-42 | Xem danh sách thông báo | User | Xem notifications, lọc chưa đọc, hiển thị count |
| UC-43 | Đánh dấu đã đọc | User | Mark as read một hoặc tất cả notifications |

---

## 4. Luồng sự kiện - UC-42: Xem danh sách thông báo

**Tiền điều kiện:** User đã đăng nhập

**Luồng chính:**
1. User click icon notification
2. Hệ thống query notifications của user
3. <<include>> Count Unread: Đếm số chưa đọc
4. Hiển thị dropdown với danh sách notifications
5. User có thể click vào notification để đến task liên quan

**Hậu điều kiện:** Notifications được hiển thị

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | Notifications tự động tạo khi task thay đổi |
| BR-02 | Chỉ watchers mới nhận notification |
| BR-03 | Hiển thị count unread trên icon |

---

*Ngày tạo: 2026-01-15*
