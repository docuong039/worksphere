# Use Case Diagram 8: File đính kèm (Attachments)

> **Module**: Attachments | **Số UC**: 4 | **Ngày**: 2026-01-15

---

## 1. Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| **User** | Primary | Thành viên dự án |

---

## 2. Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

title Worksphere - UC Diagram: Attachments

actor "User" as User #3498DB

rectangle "Worksphere System" {
  package "Attachments" #FFF3E0 {
    usecase "UC-33: Xem file đính kèm" as UC33
    usecase "UC-34: Tải lên file" as UC34
    usecase "UC-35: Tải xuống file" as UC35
    usecase "UC-36: Xóa file đính kèm" as UC36
  }
  
  usecase "Save to Disk" as UC_SAVE <<internal>>
  usecase "Generate UUID" as UC_UUID <<internal>>
}

User --> UC33
User --> UC34
User --> UC35
User --> UC36

UC34 .> UC_SAVE : <<include>>
UC34 .> UC_UUID : <<include>>

note right of UC34
  File lưu với tên UUID
  trong public/uploads
end note

note right of UC36
  Chỉ uploader hoặc
  Admin mới được xóa
end note
@enduml
```

---

## 3. Bảng mô tả Use Cases

| UC ID | Tên Use Case | Actor | Mô tả |
|-------|--------------|-------|-------|
| UC-33 | Xem file đính kèm | User | Xem danh sách files: tên, size, type, uploader, date |
| UC-34 | Tải lên file | User | Upload file, lưu với UUID trong public/uploads |
| UC-35 | Tải xuống file | User | Download file về máy |
| UC-36 | Xóa file đính kèm | User | Xóa file (uploader hoặc Admin) |

---

## 4. Luồng sự kiện - UC-34: Tải lên file

**Tiền điều kiện:** User là member của project

**Luồng chính:**
1. User mở chi tiết task
2. User click "Đính kèm file"
3. User chọn file từ máy
4. <<include>> Generate UUID: Tạo tên file duy nhất
5. <<include>> Save to Disk: Lưu file vào public/uploads
6. Hệ thống tạo Attachment record với metadata
7. Hiển thị file trong danh sách attachments

**Ngoại lệ:**
- E1: File quá lớn → Hiển thị lỗi
- E2: Loại file không hợp lệ → Hiển thị lỗi

**Hậu điều kiện:** File được upload và lưu

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | File lưu với tên UUID để tránh trùng |
| BR-02 | Chỉ uploader hoặc Admin mới được xóa |
| BR-03 | Lưu metadata: filename, contentType, size |

---

*Ngày tạo: 2026-01-15*
