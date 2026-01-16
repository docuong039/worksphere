# Activity Diagram: UC-26 - Thay đổi trạng thái công việc

> **Module**: Task Management  
> **Use Case ID**: UC-26  
> **Tên Use Case**: Thay đổi trạng thái  
> **Ngày tạo**: 2026-01-16

---

## 1. Phân tích LTOT

### 1.1. Mục đích
- Cho phép người dùng thay đổi trạng thái công việc theo các chuyển đổi được phép trong Workflow

### 1.2. Actors
- **User**: Người có quyền chỉnh sửa công việc
- **System**: Hệ thống Worksphere

### 1.3. Kết quả có thể
- **Success**: Status được cập nhật, doneRatio tự động điều chỉnh
- **Failure**: Từ chối theo workflow

### 1.4. Các bước chính
1. User chọn trạng thái mới
2. System kiểm tra workflow transition
3. System cập nhật status và doneRatio
4. System gửi thông báo cho watchers
5. System cập nhật parent attributes

---

## 2. Activity Diagram

```plantuml
@startuml
title UC-26: Thay đổi trạng thái công việc

' Styling
skinparam ActivityBackgroundColor LightSkyBlue
skinparam ActivityBorderColor Black
skinparam PartitionBorderColor Navy
skinparam PartitionBackgroundColor WhiteSmoke

|User|
start
:Mở chi tiết công việc;
:Chọn trạng thái mới từ dropdown;

|System|
:Kiểm tra quyền chỉnh sửa công việc;
note right
  Admin hoặc có quyền:
  - tasks.edit_any
  - tasks.edit_own
  - tasks.edit_assigned
end note

if (Có quyền chỉnh sửa?) then (yes)
  if (Là Administrator?) then (yes)
    :Bỏ qua kiểm tra workflow;
  else (no)
    :Kiểm tra WorkflowTransition;
    note right
      trackerId = task.tracker
      fromStatusId = current status
      toStatusId = new status
      roleId = user's role hoặc NULL
    end note
    
    if (Transition được phép?) then (no)
      :Trả về lỗi 403:
      "Không được phép chuyển sang
      trạng thái này theo Workflow";
      
      |User|
      :Hiển thị thông báo lỗi;
      detach
    endif
  endif
  
  |System|
  :Cập nhật trạng thái công việc;
  
  :Điều chỉnh doneRatio tự động;
  note right
    Nếu status.isClosed = true:
      doneRatio = 100
    Nếu từ đóng → mở:
      doneRatio = defaultDoneRatio
    Ngược lại: giữ nguyên
  end note
  
  :Tăng lockVersion;
  
  :Gửi thông báo cho watchers;
  note right
    notifyStatusChanged()
  end note
  
  if (Có Parent Task?) then (yes)
    :Cập nhật thuộc tính Parent (roll-up);
    note right
      updateParentAttributes()
    end note
  endif
  
  :Ghi nhật ký hoạt động;
  note right
    logUpdate() với chi tiết
    giá trị cũ và mới
  end note
  
  :Trả về task đã cập nhật;
  
  |User|
  :Hiển thị trạng thái mới;
  :Cập nhật doneRatio hiển thị;
else (no)
  |System|
  :Trả về lỗi 403:
  "Không có quyền sửa task này";
  
  |User|
  :Hiển thị thông báo từ chối;
endif

stop

@enduml
```

---

## 3. Source Code Reference

| File | Function/Method | Line | Mô tả |
|------|-----------------|------|-------|
| `src/app/api/tasks/[id]/route.ts` | `PUT()` | - | API cập nhật task |
| `src/lib/services/task-service.ts` | `updateParentAttributes()` | - | Cập nhật parent roll-up |

---

## 4. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Workflow Required | Chuyển status phải theo WorkflowTransition |
| BR-02 | Admin Bypass | Admin bỏ qua kiểm tra workflow |
| BR-03 | Auto DoneRatio | Status đóng → doneRatio = 100% |
| BR-04 | Reopen Reset | Mở lại task đóng → reset doneRatio |
| BR-05 | Notify Watchers | Tự động thông báo khi status thay đổi |

---

## 5. Checklist LTOT

- [x] Có đúng 1 start
- [x] Có đúng 1 stop chính
- [x] Dùng detach cho lỗi workflow cần thoát sớm
- [x] Tất cả if-else đều có endif
- [x] Swimlanes phân chia rõ User/System
- [x] Activity đặt tên bằng động từ rõ ràng

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày tạo: 2026-01-16*
