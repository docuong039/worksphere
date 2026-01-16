# Activity Diagram 20: Gán công việc (UC-27)

> **Use Case**: UC-27 - Gán công việc  
> **Module**: Quản lý công việc  
> **Áp dụng nguyên tắc**: LTOT (Logic Thinking Only Thinking)

---

## 1. Logic Thinking (LTOT)

### Ngữ cảnh
Đây là một trường hợp đặc biệt của Use Case "Cập nhật công việc", nhưng tập trung vào logic kiểm tra người thực hiện (Assignee).

### Câu hỏi tự vấn:
1.  **Đầu vào**: User yêu cầu thay đổi `assigneeId` của một Task.
2.  **Logic chính**:
    *   **Quyền sửa**: User có quyền sửa task này không?
    *   **Thành viên**: Người được gán (New Assignee) có phải là thành viên dự án không?
    *   **Quyền gán việc**:
        *   Nếu tự gán cho mình (Self-assign) -> Luôn OK (nếu có quyền sửa).
        *   Nếu gán cho người khác -> Cần kiểm tra quyền `role.canAssignToOther`.
3.  **Hành động**: Update DB -> Gửi thông báo cho người được gán.

---

## 2. Mã PlantUML

```plantuml
@startuml
title Quy trình Gán công việc (UC-27)

start

:Nhận yêu cầu thay đổi Assignee;
:Lấy thông tin User (Requester) & Task;

if (Requester có quyền sửa Task?) then (No)
  :Trả lỗi 403 (Forbidden);
  stop
else (Yes)
endif

:Kiểm tra Assignee mới;

if (Assignee mới tồn tại trong Project Member?) then (No)
  :Trả lỗi 400 (User không thuộc dự án);
  stop
else (Yes)
endif

' Logic kiểm tra quyền gán
if (Requester ID == Assignee ID?) then (Yes (Tự nhận việc))
  :Cho phép gán;
else (No (Gán cho người khác))
  :Kiểm tra Role của Requester;
  if (Role.canAssignToOther == true?) then (Yes)
    :Cho phép gán;
  else (No)
    :Trả lỗi 403 (Không có quyền gán việc cho người khác);
    stop
  endif
endif

:Cập nhật Task (assigneeId = NewID);

' Thông báo
fork
  :Ghi Audit Log (Update Assignee);
fork again
  if (Assignee != Requester?) then (Yes)
    :Tạo Notification cho Assignee mới
    ("Bạn đã được gán công việc...");
  else (No)
  endif
end fork

:Trả về kết quả thành công;

stop
@enduml
```

---

## 3. Checklist kiểm tra LTOT

- [x] **Single Start/End Check**: Luồng chính đi thẳng từ trên xuống dưới, rẽ nhánh lỗi `stop` ngay lập tức để tránh nesting sâu.
- [x] **Business Logic**: Thể hiện rõ logic phân biệt giữa "Tự nhận việc" và "Gán cho người khác".

---

*Ngày tạo: 2026-01-16*
