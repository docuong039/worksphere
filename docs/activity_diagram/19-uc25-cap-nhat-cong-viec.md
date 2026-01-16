# Activity Diagram 19: Cập nhật công việc (UC-25)

> **Use Case**: UC-25 - Cập nhật công việc  
> **Module**: Quản lý công việc  
> **Áp dụng nguyên tắc**: LTOT (Logic Thinking Only Thinking) - Single End Node

---

## 1. Logic Thinking (LTOT)

### Câu hỏi tự vấn:
1.  **Đầu vào**: Người dùng gửi request PUT cập nhật task (tiêu đề, trạng thái, assignee...).
2.  **Logic chính**:
    *   Kiểm tra đăng nhập & quyền sửa.
    *   Lấy task hiện tại từ DB.
    *   **Optimistic Lock**: So sánh `lockVersion`.
    *   **Validation**: Workflow (nếu đổi status), Assignee (nếu đổi người), Parent (nếu đổi cha).
    *   Thực hiện Update.
    *   Side effects: Update Parent, Notify, Audit Log.
3.  **Đầu ra**: Trả về Task đã update hoặc Lỗi.
4.  **Điểm kết thúc**: Chỉ có **1 điểm Stop** chính sau khi trả response. Các lỗi trả response lỗi rồi merge về điểm này.

---

## 2. Mã PlantUML

```plantuml
@startuml
title Quy trình Cập nhật công việc (UC-25)

start

:Nhận request cập nhật Task (PUT);
:Lấy thông tin Session (User);

if (Đã đăng nhập?) then (No)
  :Trả lỗi 401 (Unauthorized);
  detach
else (Yes)
endif

:Truy vấn Permission & Task hiện tại;

if (Có quyền sửa Task?) then (No)
  note right
    Quyền: edit_any, edit_own, hoặc edit_assigned
  end note
  :Trả lỗi 403 (Forbidden);
  stop
else (Yes)
  :Parse và Validate dữ liệu đầu vào (Zod);
endif

if (Validation dữ liệu thành công?) then (No)
  :Trả lỗi 400 (Bad Request);
  stop
else (Yes)
endif

' Optimistic Locking Check
if (Input.lockVersion == CurrentTask.lockVersion?) then (No)
  :Trả lỗi 409 (Conflict - Dữ liệu cũ);
  stop
else (Yes)
endif

' Workflow Check
if (Có thay đổi trạng thái (Status)?) then (Yes)
  if (Check Workflow Transition?) then (Hợp lệ)
    :Tính toán doneRatio (nếu cần);
  else (Không hợp lệ)
    :Trả lỗi 403 (Workflow Error);
    stop
  endif
else (No)
endif

' Assignee Check
if (Có thay đổi người thực hiện (Assignee)?) then (Yes)
  if (Assignee là thành viên Project?) then (Yes)
    if (User có quyền 'canAssignToOther'?) then (Yes)
      :Chuẩn bị dữ liệu Assignee mới;
    else (No)
      :Trả lỗi 403 (Quyền gán việc);
      stop
    endif
  else (No)
    :Trả lỗi 400 (Assignee not in project);
    stop
  endif
else (No)
endif

' Update DB
:Thực hiện UPDATE Task trong DB
(Tăng lockVersion +1);

' Side effects (Parallel)
fork
  if (Có thay đổi Parent?) then (Yes)
    :Tính lại Path & Level subtasks;
  else (No)
  endif
fork again
  if (Task con hoặc Task cha thay đổi?) then (Yes)
    :Roll-up tính toán Task cha;
  else (No)
  endif
fork again
  :Ghi Audit Log;
fork again
  if (Cần thông báo?) then (Yes)
    :Gửi Notification (Async);
  else (No)
  endif
end fork

:Trả về kết quả thành công (200 OK);

stop
@enduml
```

---

## 3. Checklist kiểm tra LTOT

- [x] **Single Start/End**: Một điểm bắt đầu và các điểm kết thúc được kiểm soát (detach cho lỗi auth, stop cho lỗi logic, luồng chính về stop cuối).
- [x] **Logic Flow**: Kiểm tra điều kiện tiên quyết (Auth, Perm) trước khi xử lý sâu.
- [x] **Error Handling**: Các nhánh lỗi (Validation, Lock, Workflow) đều kết thúc quy trình rõ ràng.
- [x] **Parallel Processing**: Sử dụng `fork` cho các tác vụ phụ (Side effects) như Log, Notify để thể hiện tính bất đồng bộ/song song.

---

*Ngày tạo: 2026-01-16*
