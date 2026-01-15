# Sequence Diagram 07: Thêm bình luận (UC-30)

> **Use Case**: UC-30 - Thêm bình luận  
> **Module**: Comments  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Comment Service, Notification Service, Database |
| **Trigger** | User submit comment |
| **Precondition** | User là member của project |
| **Postcondition** | Comment created, Task updated, Watchers notified |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Thêm bình luận (UC-30)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/tasks/[id]/comments)" as API #Orange
participant "Comment\nService" as CommentService #LightGreen
participant "Notification\nService" as NotifyService #Cyan
database "Database\n(Prisma)" as DB #LightGray

== Enter Comment ==
User -> Browser: Type comment in textarea
User -> Browser: Click "Gửi"

Browser -> API: POST /api/tasks/{taskId}/comments\n{content}

== Authentication ==
API -> API: getServerSession()
alt Chưa đăng nhập
    API --> Browser: 401 Unauthorized
end

== Check Membership ==
API -> DB: SELECT * FROM ProjectMember\nWHERE userId = ? AND projectId = ?
DB --> API: member | null

alt Không phải member
    API --> Browser: 403 Forbidden
    Browser --> User: "Bạn không phải thành viên của dự án này"
end

== Validate Content ==
API -> CommentService: createComment(taskId, userId, content)
CommentService -> CommentService: Validate content not empty

alt Content rỗng
    CommentService --> API: ValidationError
    API --> Browser: 400 Bad Request
    Browser --> User: "Nội dung không được để trống"
end

== Create Comment ==
CommentService -> DB: INSERT INTO Comment\n(taskId, userId, content, createdAt)
DB --> CommentService: newComment

== Update Task ==
CommentService -> DB: UPDATE Task SET updatedAt = NOW()\nWHERE id = ?
DB --> CommentService: updated

== Get Watchers ==
CommentService -> NotifyService: notifyWatchers(taskId, userId, "comment_added")
NotifyService -> DB: SELECT userId FROM Watcher\nWHERE taskId = ?
DB --> NotifyService: watchers[]

== Create Notifications ==
loop For each watcher (exclude comment author)
    alt watcher.userId !== commentAuthorId
        NotifyService -> DB: INSERT INTO Notification\n(userId, type, message, taskId, isRead=false)
        DB --> NotifyService: notification
    end
end

== Load Comment with Author ==
CommentService -> DB: SELECT c.*, u.name, u.email, u.avatar\nFROM Comment c\nJOIN User u ON c.userId = u.id\nWHERE c.id = ?
DB --> CommentService: commentWithAuthor

== Response ==
CommentService --> API: commentWithAuthor
API --> Browser: 201 Created\n{comment}

Browser -> Browser: Add comment to list
Browser -> Browser: Clear textarea
Browser --> User: Comment displayed

@enduml
```

---

## 3. Notification Creation

```javascript
// For each watcher (except comment author)
watchers.filter(w => w.userId !== authorId).forEach(watcher => {
  createNotification({
    userId: watcher.userId,
    type: "comment_added",
    message: `${authorName} đã bình luận trên công việc #${taskNumber}`,
    taskId: taskId,
    isRead: false
  });
});
```

---

## 4. Request/Response

### Request
```http
POST /api/tasks/task-uuid/comments
Content-Type: application/json

{
  "content": "This is a comment on the task."
}
```

### Response (Success)
```http
HTTP/1.1 201 Created

{
  "id": "comment-uuid",
  "content": "This is a comment on the task.",
  "createdAt": "2026-01-15T17:00:00Z",
  "author": {
    "id": "user-uuid",
    "name": "John Doe",
    "avatar": "/uploads/avatar.jpg"
  }
}
```

---

## 5. Side Effects

| Action | Description |
|--------|-------------|
| Update Task | task.updatedAt = NOW() |
| Notify Watchers | Create notification for each watcher |
| Exclude Author | Author không nhận notification về comment của mình |

---

*Ngày tạo: 2026-01-15*
