# Activity Diagram: UC-44 - Tìm kiếm toàn cục

> **Module**: Global Search  
> **Use Case ID**: UC-44  
> **Tên Use Case**: Tìm kiếm toàn cục  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép người dùng tìm kiếm trong toàn hệ thống (tasks, projects, comments, users)

### 1.2. Actors
- **User**: Người dùng đã đăng nhập
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Kết quả tìm kiếm theo từng loại entity
- **Failure**: Không tìm thấy kết quả

### 1.4. Các bước chính
1. User nhập từ khóa tìm kiếm
2. System tìm kiếm song song trên các entity
3. System lọc kết quả theo quyền
4. System trả về kết quả grouped by type

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-44: Tìm kiếm toàn cục

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Mở Global Search (Ctrl+K hoặc click);

|System|
:Hiển thị dialog tìm kiếm;

|User|
:Nhập từ khóa tìm kiếm;

|System|
:Kiểm tra từ khóa >= 2 ký tự;

if (Từ khóa đủ dài?) then (yes)
  :Xác định danh sách dự án user được phép;
  note right
    Admin: tất cả dự án
    User: dự án là member
  end note
  
  fork
    :Tìm kiếm Tasks;
    note right
      title hoặc description
      chứa từ khóa
      Giới hạn 5 kết quả
    end note
  fork again
    :Tìm kiếm Projects;
    note right
      name hoặc identifier
      chứa từ khóa
      Giới hạn 5 kết quả
    end note
  fork again
    :Tìm kiếm Comments;
    note right
      content chứa từ khóa
      Giới hạn 5 kết quả
    end note
  fork again
    if (Là Administrator?) then (yes)
      :Tìm kiếm Users;
      note right
        name hoặc email
        Chỉ admin mới search được
      end note
    endif
  end fork
  
  :Lọc kết quả theo quyền truy cập;
  note right
    Non-admin chỉ thấy kết quả
    trong project mình là member
  end note
  
  :Nhóm kết quả theo loại entity;
  
  :Trả về kết quả tìm kiếm;
  
  |User|
  if (Có kết quả?) then (yes)
    :Hiển thị kết quả theo nhóm:
    - Tasks
    - Projects  
    - Comments
    - Users (nếu có);
  else (no)
    :Hiển thị "Không tìm thấy kết quả";
  endif
else (no)
  |System|
  :Không thực hiện tìm kiếm;
  
  |User|
  :Hiển thị placeholder:
  "Nhập ít nhất 2 ký tự";
endif

|User|
if (Chọn một kết quả?) then (yes)
  :Điều hướng đến trang chi tiết;
else (no)
  :Đóng dialog tìm kiếm;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/search/route.ts` | `GET()` | - | API tìm kiếm toàn cục |
| `src/components/layout/global-search.tsx` | - | - | Component Global Search dialog |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Min Query Length | Từ khóa tối thiểu 2 ký tự |
| BR-02 | Permission Filter | Non-admin chỉ thấy kết quả trong project là member |
| BR-03 | User Search Admin Only | Chỉ admin mới search được users |
| BR-04 | Result Limit | Mỗi loại entity giới hạn 5 kết quả |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop
- [x] Fork/Join cho tìm kiếm song song
- [x] Tất cả if-else đều có endif
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
