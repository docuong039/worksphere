# Activity Diagram: UC-34 - Tải lên file đính kèm

> **Module**: Attachments  
> **Use Case ID**: UC-34  
> **Tên Use Case**: Tải lên file  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép thành viên dự án upload file đính kèm vào công việc

### 1.2. Actors
- **User**: Thành viên của dự án chứa công việc
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: File được lưu với tên UUID, metadata được tạo
- **Failure**: Từ chối (không có quyền, file quá lớn, loại file không hợp lệ)

### 1.4. Các bước chính
1. User chọn file để upload
2. System validate file (size, type)
3. System tạo UUID filename
4. System lưu file vào public/uploads
5. System tạo Attachment record

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-34: Tải lên file đính kèm

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Mở chi tiết công việc;
:Nhấn nút "Đính kèm file";
:Chọn file từ máy tính;

|System|
:Nhận file upload;

:Kiểm tra session đăng nhập;

if (Đã đăng nhập?) then (yes)
  :Truy vấn Task và kiểm tra tồn tại;
  
  if (Task tồn tại?) then (yes)
    :Kiểm tra user là member của dự án;
    
    if (Là member dự án?) then (yes)
      :Validate kích thước file;
      note right
        Max size: 10MB
      end note
      
      if (File size hợp lệ?) then (yes)
        :Tạo UUID cho filename;
        note right
          uuid() + extension
          để tránh trùng lặp
        end note
        
        :Lưu file vào public/uploads;
        note right
          fs.writeFile()
          đường dẫn: /uploads/{uuid}
        end note
        
        :Tạo Attachment record;
        note right
          prisma.attachment.create()
          filename, originalName, 
          contentType, size, userId
        end note
        
        :Cập nhật task.updatedAt;
        
        :Trả về attachment đã tạo;
        
        |User|
        :Hiển thị file trong danh sách đính kèm;
        :Hiển thị thông báo thành công;
      else (no)
        |System|
        :Trả về lỗi 400:
        "File quá lớn (tối đa 10MB)";
        
        |User|
        :Hiển thị thông báo lỗi;
      endif
    else (no)
      |System|
      :Trả về lỗi 403:
      "Không phải thành viên dự án";
      
      |User|
      :Hiển thị thông báo từ chối;
    endif
  else (no)
    |System|
    :Trả về lỗi 404:
    "Công việc không tồn tại";
    
    |User|
    :Hiển thị thông báo lỗi;
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
| `src/app/api/tasks/[id]/attachments/route.ts` | `POST()` | - | API upload attachment |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Member Only | Chỉ member dự án mới được upload |
| BR-02 | Max Size | File tối đa 10MB |
| BR-03 | UUID Filename | Tên file được đổi thành UUID để tránh trùng |
| BR-04 | Store Original | Lưu tên file gốc trong originalName |
| BR-05 | Auto Update | Task.updatedAt được cập nhật |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Tất cả if-else đều có endif
- [x] Các nhánh error merge về stop chung
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
