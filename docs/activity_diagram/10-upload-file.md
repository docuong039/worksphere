# Activity Diagram 10: Tải lên file (UC-34)

> **Use Case**: UC-34 - Tải lên file  
> **Module**: Attachments  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, File System, Database |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Tải lên file (UC-34)

|User|
start
:Mở chi tiết công việc;
:Click "Đính kèm file";
:Chọn file từ máy;

|System|
:Kiểm tra kích thước file;

if (Size > MAX_SIZE?) then (Có)
  :Hiển thị lỗi "File quá lớn";
  note right
    MAX_SIZE = 10MB
  end note
  |User|
  stop
endif

:Kiểm tra loại file;

if (Type không được phép?) then (Có)
  :Hiển thị lỗi "Loại file không hợp lệ";
  |User|
  stop
endif

:Generate UUID filename;
note right
  uuid() + extension
  vd: "a1b2c3d4.pdf"
end note

|File System|
:Lưu file vào public/uploads/;

|Database|
:INSERT Attachment;
note right
  taskId
  userId (uploader)
  filename (original)
  storedFilename (UUID)
  contentType
  size
end note

|System|
:Trả về attachment info;

|User|
:Hiển thị file trong danh sách;
:Hiển thị thông báo thành công;

stop

@enduml
```

---

## 3. Mô tả các bước

| # | Actor | Hành động | Ghi chú |
|---|-------|-----------|---------|
| 1 | User | Click đính kèm | Open file picker |
| 2 | User | Chọn file | From disk |
| 3 | System | Validate size | < 10MB |
| 4 | System | Validate type | Allowed types |
| 5 | System | Generate UUID | Unique filename |
| 6 | File System | Save file | public/uploads/ |
| 7 | Database | Create record | Metadata |
| 8 | User | View file | In list |

---

## 4. Validation Rules

| Rule | Giá trị | Mô tả |
|------|---------|-------|
| Max size | 10 MB | Giới hạn kích thước |
| Allowed types | pdf, doc, docx, xls, xlsx, png, jpg, gif | Whitelist |
| UUID filename | uuid() + ext | Tránh trùng tên |

---

## 5. Business Rules

| Rule | Mô tả |
|------|-------|
| BR-01 | File lưu với UUID để tránh conflict |
| BR-02 | Lưu original filename trong DB |
| BR-03 | Chỉ uploader hoặc Admin được xóa |

---

*Ngày tạo: 2026-01-15*
