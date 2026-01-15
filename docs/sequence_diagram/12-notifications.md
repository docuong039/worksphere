# Sequence Diagram 12: Xem thông báo (UC-42)

> **Use Case**: UC-42 - Xem danh sách thông báo  
> **Module**: Notifications  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, API, Notification Service, Database |
| **Trigger** | User click notification icon |
| **Precondition** | User đã đăng nhập |
| **Postcondition** | Notifications list displayed with unread count |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Xem thông báo (UC-42)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "API Route\n(/api/notifications)" as API #Orange
participant "Notification\nService" as NotifyService #LightGreen
database "Database\n(Prisma)" as DB #LightGray

== Initial Load (Navbar) ==
Browser -> API: GET /api/notifications/count
API -> API: getServerSession()
API -> NotifyService: getUnreadCount(userId)
NotifyService -> DB: SELECT COUNT(*) FROM Notification\nWHERE userId = ? AND isRead = false
DB --> NotifyService: unreadCount
NotifyService --> API: unreadCount
API --> Browser: {count: 5}
Browser -> Browser: Update badge "5"

== Click Notification Icon ==
User -> Browser: Click notification icon
Browser -> API: GET /api/notifications?limit=20

== Authentication ==
API -> API: getServerSession()

== Get Notifications ==
API -> NotifyService: getNotifications(userId, limit)
NotifyService -> DB: SELECT n.*, t.taskNumber, t.subject\nFROM Notification n\nLEFT JOIN Task t ON n.taskId = t.id\nWHERE n.userId = ?\nORDER BY n.createdAt DESC\nLIMIT ?
DB --> NotifyService: notifications[]

NotifyService --> API: notifications
API --> Browser: 200 OK\n{notifications}

Browser -> Browser: Show notification dropdown
Browser --> User: Display notifications list

== Mark as Read (single) ==
User -> Browser: Click on notification
Browser -> API: PATCH /api/notifications/{id}\n{isRead: true}
API -> NotifyService: markAsRead(notificationId)
NotifyService -> DB: UPDATE Notification\nSET isRead = true\nWHERE id = ?
DB --> NotifyService: updated
NotifyService --> API: success
API --> Browser: 200 OK

Browser -> Browser: Navigate to related task
Browser -> Browser: Update unread count

== Mark All as Read ==
User -> Browser: Click "Đánh dấu tất cả đã đọc"
Browser -> API: PATCH /api/notifications/read-all
API -> NotifyService: markAllAsRead(userId)
NotifyService -> DB: UPDATE Notification\nSET isRead = true\nWHERE userId = ? AND isRead = false
DB --> NotifyService: updatedCount
NotifyService --> API: {count: updatedCount}
API --> Browser: 200 OK\n{count: 5}

Browser -> Browser: Update all notifications as read
Browser -> Browser: Set badge to 0
Browser --> User: All notifications marked as read

@enduml
```

---

## 3. Notification Types

| Type | Message Template | Link |
|------|------------------|------|
| task_assigned | "{user} đã gán công việc #{taskNumber} cho bạn" | /tasks/{id} |
| task_updated | "{user} đã cập nhật công việc #{taskNumber}" | /tasks/{id} |
| comment_added | "{user} đã bình luận trên #{taskNumber}" | /tasks/{id} |
| status_changed | "Trạng thái #{taskNumber} đã chuyển sang {status}" | /tasks/{id} |
| mentioned | "{user} đã nhắc đến bạn trong #{taskNumber}" | /tasks/{id} |

---

## 4. Request/Response

### Get Notifications
```http
GET /api/notifications?limit=20&unreadOnly=false
```

```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "type": "comment_added",
      "message": "John đã bình luận trên #42",
      "taskId": "task-uuid",
      "taskNumber": 42,
      "taskSubject": "Login feature",
      "isRead": false,
      "createdAt": "2026-01-15T17:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### Mark as Read
```http
PATCH /api/notifications/notif-uuid
{"isRead": true}
```

### Mark All as Read
```http
PATCH /api/notifications/read-all
```

---

## 5. Polling / Real-time

```javascript
// Option 1: Polling every 30s
setInterval(() => {
  fetchUnreadCount();
}, 30000);

// Option 2: SSE (future enhancement)
const eventSource = new EventSource('/api/notifications/stream');
eventSource.onmessage = (e) => updateCount(e.data);
```

---

*Ngày tạo: 2026-01-15*
