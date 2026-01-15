# Activity Diagram 09: Thêm bình luận (UC-30)

> **Use Case**: UC-30 - Thêm bình luận  
> **Module**: Comments  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Actors** | User |
| **Độ phức tạp** | Trung bình |
| **Swimlanes** | User, System, Database |
| **Đặc điểm** | Parallel notification |

---

## 2. Activity Diagram (PlantUML)

```plantuml
@startuml
title Activity Diagram: Thêm bình luận (UC-30)

|User|
start
:Mở chi tiết công việc;
:Cuộn đến phần Comments;
:Nhập nội dung bình luận;
:Click "Gửi";

|System|
:Check user là member của project;

if (Là member?) then (Không)
  :Hiển thị lỗi 403 Forbidden;
  |User|
  stop
endif

:Validate content;

if (Content rỗng?) then (Có)
  :Hiển thị lỗi "Nội dung không được trống";
  |User|
  stop
endif

|Database|
:INSERT Comment;
note right
  taskId, userId, content
  createdAt = NOW()
end note

:UPDATE Task SET updatedAt = NOW();

:SELECT watchers WHERE taskId;

|System|
fork
  :Với mỗi watcher (trừ author):;
  |Database|
  :INSERT Notification;
  note right
    type = "comment_added"
    userId = watcher
    taskId = task
  end note
fork again
  :Trả về comment mới;
end fork

|User|
:Hiển thị comment mới trong list;
:Clear input field;

stop

@enduml
```

---

## 3. Mô tả các bước

| # | Actor | Hành động | Ghi chú |
|---|-------|-----------|---------|
| 1 | User | Mở task detail | - |
| 2 | User | Nhập comment | Required |
| 3 | System | Check membership | Project member |
| 4 | System | Validate content | Not empty |
| 5 | Database | Create comment | INSERT |
| 6 | Database | Update task.updatedAt | Touch task |
| 7 | Database | Get watchers | List |
| 8 | System | Create notifications | Parallel |
| 9 | User | View comment | Realtime |

---

## 4. Business Rules

| Rule | Mô tả |
|------|-------|
| BR-01 | Chỉ project member mới được comment |
| BR-02 | Comment tự động update task.updatedAt |
| BR-03 | Notify cho watchers (trừ author) |
| BR-04 | Comment không thể rỗng |

---

*Ngày tạo: 2026-01-15*
