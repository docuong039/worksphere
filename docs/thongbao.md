# 📢 Hệ Thống Thông Báo (Notification System)

> **Dự án:** Worksphere — Hệ thống quản lý công việc  
> **Công nghệ Realtime:** SSE (Server-Sent Events)  
> **Cập nhật lần cuối:** 21/02/2026

---

## 1. Tổng Quan

Hệ thống thông báo của Worksphere gửi thông tin realtime tới người dùng khi có các sự kiện quan trọng xảy ra trong dự án. Thông báo được **lưu vào cơ sở dữ liệu** (để không bị mất) và đồng thời **push tức thì** qua SSE tới trình duyệt của người nhận (nếu đang online).

### Nguyên tắc chung

- **Không tự thông báo cho chính mình:** Người thực hiện hành động (actor) sẽ không nhận thông báo về hành động của chính họ.
- **Fire-and-forget:** Các lệnh gửi thông báo được gọi bất đồng bộ, không block API response.
- **Fallback:** Nếu người dùng offline khi thông báo được gửi → dữ liệu vẫn an toàn trong DB, client sẽ nhận lại khi mở ứng dụng hoặc SSE reconnect.

---

## 2. Công Nghệ: SSE (Server-Sent Events)

### SSE là gì?

SSE (Server-Sent Events) là một Web API tiêu chuẩn cho phép server **đẩy dữ liệu tới trình duyệt** qua một kết nối HTTP duy nhất, giữ mở liên tục. Khác với WebSocket (2 chiều), SSE chỉ truyền dữ liệu **1 chiều** từ server → client — hoàn toàn đủ cho hệ thống thông báo.

### Tại sao chọn SSE thay vì WebSocket?

| Tiêu chí                  | SSE ✅                         | WebSocket ❌                      |
|--------------------------|-------------------------------|----------------------------------|
| Tương thích Next.js App Router | ✅ Native, không cần custom server | ❌ Cần custom Node.js server      |
| Độ phức tạp              | 🟢 Thấp                       | 🔴 Cao                           |
| Realtime                 | ✅ Push tức thì                | ✅ Push tức thì                   |
| Cần infra thêm           | ❌ Không                       | ✅ Cần server/Pusher riêng        |
| Auto reconnect           | ✅ Browser tự xử lý           | ❌ Phải code thủ công            |
| Phù hợp notification     | ✅ Đúng mục đích (1 chiều)    | ⚠️ Overkill (2 chiều)           |

### Kiến trúc SSE trong Worksphere

```
┌─────────────────────────────────────────────────────────────┐
│                        SERVER                                │
│                                                               │
│  API Route (vd: POST /api/tasks)                             │
│       │                                                       │
│       ├─ 1. Lưu notification vào DB (Prisma)                 │
│       │                                                       │
│       └─ 2. sseManager.emit(userId, 'notification', data)    │
│              │                                                │
│              ▼                                                │
│  ┌─────────────────────┐                                     │
│  │   SSE Manager        │   (Singleton — lưu trong globalThis)│
│  │                       │                                     │
│  │  connections:         │                                     │
│  │    userId₁ → [ctrl₁, ctrl₂]  ← 2 tab đang mở              │
│  │    userId₂ → [ctrl₃]         ← 1 tab đang mở              │
│  │    userId₃ → []              ← offline                     │
│  └─────────┬───────────┘                                     │
│            │                                                  │
│            ▼                                                  │
│  GET /api/sse (SSE Endpoint)                                 │
│    - Xác thực session                                        │
│    - Tạo ReadableStream                                      │
│    - Đăng ký controller vào Manager                          │
│    - Heartbeat mỗi 25s (giữ kết nối)                        │
│    - Dọn dẹp khi client đóng tab                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               │  HTTP Streaming (text/event-stream)
               ▼
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                               │
│  NotificationBell component                                  │
│    │                                                          │
│    ├─ new EventSource('/api/sse')                             │
│    │    ├─ on 'connected'  → reset reconnect delay           │
│    │    ├─ on 'notification' → thêm vào list + tăng badge    │
│    │    └─ on error → auto reconnect (exponential backoff)   │
│    │                                                          │
│    └─ Fallback poll mỗi 5 phút (đảm bảo đồng bộ)           │
└─────────────────────────────────────────────────────────────┘
```

### Các file liên quan

| File                                        | Vai trò                                    |
|--------------------------------------------|--------------------------------------------|
| `src/lib/sse.ts`                           | SSE Connection Manager (Singleton)         |
| `src/app/api/sse/route.ts`                 | SSE Endpoint — giữ kết nối mở             |
| `src/lib/notifications.ts`                 | Logic tạo notification + emit SSE          |
| `src/components/layout/notification-bell.tsx` | UI chuông thông báo + SSE listener       |
| `src/app/(frontend)/notifications/page.tsx` | Trang xem tất cả thông báo               |
| `src/app/api/notifications/route.ts`       | API lấy/đánh dấu đã đọc thông báo        |

---

## 3. Danh Sách Các Loại Thông Báo

### 3.1. Thông báo liên quan đến Công việc (Task)

#### `task_assigned` — Được gán công việc mới

| Mục          | Chi tiết                                                       |
|--------------|---------------------------------------------------------------|
| **Khi nào**  | Khi một task được tạo mới có assignee, hoặc assignee thay đổi |
| **Gửi cho**  | Người được gán (assignee mới)                                 |
| **Nội dung** | _"Tuấn đã gán cho bạn công việc: \\"Thiết kế giao diện\\""_   |
| **Metadata** | `{ taskId }`                                                  |
| **Link**     | `/tasks/[taskId]`                                             |
| **Icon**     | 👤 User (xanh dương)                                         |
| **Trigger tại** | `POST /api/tasks` · `PUT /api/tasks/[id]`                  |

#### `task_status_changed` — Trạng thái công việc thay đổi

| Mục          | Chi tiết                                                                   |
|--------------|---------------------------------------------------------------------------|
| **Khi nào**  | Khi status của task được cập nhật (vd: "Đang làm" → "Hoàn thành")        |
| **Gửi cho**  | Watchers + Assignee + Creator (trừ actor)                                 |
| **Nội dung** | _"Tuấn đã chuyển \\"Thiết kế giao diện\\" từ Đang làm sang Hoàn thành"_ |
| **Metadata** | `{ taskId, projectId }`                                                   |
| **Link**     | `/tasks/[taskId]`                                                         |
| **Icon**     | ⚠️ AlertCircle (cam)                                                     |
| **Trigger tại** | `PUT /api/tasks/[id]`                                                  |

#### `task_comment_added` — Có bình luận mới

| Mục          | Chi tiết                                                                      |
|--------------|------------------------------------------------------------------------------|
| **Khi nào**  | Khi có bình luận mới trên task                                               |
| **Gửi cho**  | Watchers + Assignee + Creator (trừ người bình luận)                          |
| **Nội dung** | _"Tuấn đã bình luận về \\"Thiết kế giao diện\\": \\"Cần sửa lại phần header\\"..."_ |
| **Metadata** | `{ taskId, projectId, commentId }`                                           |
| **Link**     | `/tasks/[taskId]#comment-[commentId]`                                        |
| **Icon**     | 💬 MessageSquare (tím)                                                       |
| **Trigger tại** | `POST /api/tasks/[id]/comments`                                           |

#### `task_updated` — Công việc được cập nhật

| Mục          | Chi tiết                                                            |
|--------------|-------------------------------------------------------------------|
| **Khi nào**  | Khi các trường khác (description, priority, v.v.) thay đổi         |
| **Gửi cho**  | Watchers + Assignee + Creator (trừ actor)                          |
| **Nội dung** | _"Tuấn đã cập nhật công việc \\"Thiết kế giao diện\\""_            |
| **Metadata** | `{ taskId, projectId }`                                            |
| **Link**     | `/tasks/[taskId]`                                                  |
| **Icon**     | ⚠️ AlertCircle (cam)                                              |
| **Trigger tại** | `PUT /api/tasks/[id]` — khi các trường khác ngoài assignee/status thay đổi |

#### `task_due_soon` — Sắp hết hạn _(Đã khai báo — hoãn lại cho phiên bản sau)_

| Mục          | Chi tiết                                      |
|--------------|----------------------------------------------|
| **Khi nào**  | Khi deadline task gần tới (vd: còn 1 ngày)   |
| **Gửi cho**  | Assignee                                      |
| **Icon**     | 📅 Calendar (đỏ)                              |
| **Trạng thái** | ⏳ Hoãn lại — cần cron job/scheduler           |

#### `task_mentioned` — Được nhắc đến _(Đã khai báo — hoãn lại cho phiên bản sau)_

| Mục          | Chi tiết                                          |
|--------------|--------------------------------------------------|
| **Khi nào**  | Khi bị @mention trong bình luận hoặc mô tả task  |
| **Gửi cho**  | Người bị mention                                  |
| **Trạng thái** | ⏳ Hoãn lại — cần parser @mention               ||

---

### 3.2. Thông báo liên quan đến Dự án (Project)

#### `project_created` — Dự án mới được tạo

| Mục          | Chi tiết                                                     |
|--------------|-------------------------------------------------------------|
| **Khi nào**  | Khi bất kỳ ai tạo dự án mới                                |
| **Gửi cho**  | Tất cả **Admin** (trừ người tạo)                            |
| **Nội dung** | _"Tuấn đã tạo dự án mới \\"Worksphere v2\\""_               |
| **Metadata** | `{ projectId }`                                             |
| **Link**     | `/projects/[projectId]`                                     |
| **Icon**     | ⚠️ AlertCircle (xanh lá đậm)                               |
| **Trigger tại** | `POST /api/projects`                                     |

#### `project_member_added` — Được thêm vào dự án

| Mục          | Chi tiết                                                |
|--------------|--------------------------------------------------------|
| **Khi nào**  | Khi một user được thêm làm thành viên dự án            |
| **Gửi cho**  | User được thêm                                         |
| **Nội dung** | _"Tuấn đã thêm bạn vào dự án \\"Worksphere\\""_        |
| **Metadata** | `{ projectId }`                                        |
| **Link**     | `/projects/[projectId]`                                |
| **Icon**     | 👤 User (xanh lá)                                      |
| **Trigger tại** | `POST /api/projects/[id]/members`                   |

#### `project_member_removed` — Bị xóa khỏi dự án

| Mục          | Chi tiết                                                |
|--------------|--------------------------------------------------------|
| **Khi nào**  | Khi một user bị xóa khỏi dự án                         |
| **Gửi cho**  | User bị xóa                                            |
| **Nội dung** | _"Tuấn đã xóa bạn khỏi dự án \\"Worksphere\\""_        |
| **Metadata** | `{ projectId }`                                        |
| **Link**     | `/projects/[projectId]`                                |
| **Icon**     | 👤 User (xám)                                          |
| **Trigger tại** | `DELETE /api/projects/[id]/members/[memberId]`      |

---

## 4. Bảng Tổng Hợp

| # | Type                      | Gửi cho ai                        | Trigger tại API          | Trạng thái  |
|---|---------------------------|-----------------------------------|--------------------------|-------------|
| 1 | `task_assigned`           | Assignee mới                      | `tasks/` · `tasks/[id]/` | ✅ Hoạt động |
| 2 | `task_status_changed`     | Watchers + Assignee + Creator     | `tasks/[id]/`            | ✅ Hoạt động |
| 3 | `task_comment_added`      | Watchers + Assignee + Creator     | `tasks/[id]/comments/`   | ✅ Hoạt động |
| 4 | `task_updated`            | Watchers + Assignee + Creator     | `tasks/[id]/`            | ✅ Hoạt động |
| 5 | `task_due_soon`           | Assignee                          | Cron job                 | ⏳ Hoãn lại  |
| 6 | `task_mentioned`          | Người bị @mention                 | Comment / Description    | ⏳ Hoãn lại  |
| 7 | `project_created`         | Tất cả Admin                      | `projects/`              | ✅ Hoạt động |
| 8 | `project_member_added`    | User được thêm                    | `projects/[id]/members/` | ✅ Hoạt động |
| 9 | `project_member_removed`  | User bị xóa                       | `projects/[id]/members/[memberId]` | ✅ Hoạt động |

> **Chú thích:**
> - ✅ Hoạt động = Đã có code trigger đầy đủ
> - ⏳ Hoãn lại = Tính năng nâng cao, triển khai trong phiên bản sau

---

## 5. Cơ Sở Dữ Liệu

### Model `Notification` (Prisma Schema)

```prisma
model Notification {
  id        String   @id @default(cuid())
  type      String                          // Loại thông báo (vd: task_assigned)
  title     String                          // Tiêu đề ngắn
  message   String   @db.Text              // Nội dung chi tiết
  isRead    Boolean  @default(false)        // Đã đọc chưa
  metadata  String?  @db.LongText          // JSON string chứa taskId, projectId, v.v.
  userId    String                          // Người nhận
  createdAt DateTime @default(now())
  user      User     @relation(...)

  @@index([userId])
  @@index([createdAt])
  @@map("notifications")
}
```

> **Lưu ý quan trọng:** Trường `metadata` được lưu dưới dạng **JSON string** (không phải JSON object). Code phải dùng `JSON.stringify()` khi ghi và `JSON.parse()` khi đọc.

---

## 6. API Endpoints

### `GET /api/notifications`

Lấy danh sách thông báo của user hiện tại.

| Param       | Mô tả                        |
|-------------|-------------------------------|
| `limit`     | Số lượng tối đa (mặc định 20) |
| `unreadOnly`| Chỉ lấy chưa đọc (`true`)    |

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5
  }
}
```

### `PUT /api/notifications`

Đánh dấu đã đọc.

| Body                | Mô tả                       |
|---------------------|------------------------------|
| `{ notificationIds: [...] }` | Đánh dấu các ID cụ thể |
| `{ markAll: true }`          | Đánh dấu tất cả đã đọc |

### `GET /api/sse`

Endpoint SSE — giữ kết nối mở để nhận thông báo realtime.

- **Auth:** Yêu cầu đăng nhập (401 nếu chưa)
- **Content-Type:** `text/event-stream`
- **Heartbeat:** Mỗi 25 giây
- **Events:** `connected`, `notification`

---

## 7. Giao Diện Người Dùng (UI)

### Chuông Thông Báo (`NotificationBell`)
- Hiển thị trên header, có **badge đỏ** khi có thông báo chưa đọc
- Badge hiện con số (tối đa hiển thị "9+")
- Badge có **animation pulse** để thu hút sự chú ý
- Click mở dropdown hiển thị 10 thông báo gần nhất
- Click vào thông báo → navigate tới trang liên quan + tự đánh dấu đã đọc
- Nút "Đánh dấu tất cả" để mark all as read

### Trang Thông Báo (`/notifications`)
- Hiển thị đầy đủ danh sách thông báo
- Bộ lọc: Tất cả / Chưa đọc
- Chức năng đánh dấu đã đọc (từng cái hoặc tất cả)
- Hiển thị thời gian tương đối ("Vừa xong", "5 phút trước", "2 ngày trước")

---

## 8. Tính Năng Nổi Bật

| Tính năng             | Mô tả                                                              |
|-----------------------|--------------------------------------------------------------------|
| **Realtime (SSE)**    | Thông báo hiện ngay < 1 giây khi event xảy ra                     |
| **Multi-tab**         | Mở nhiều tab → tất cả đều nhận thông báo đồng thời                |
| **Optimistic UI**     | Click "Đã đọc" → badge cập nhật ngay, không chờ API response      |
| **Auto Reconnect**    | Mất mạng → tự reconnect với exponential backoff (2s → 30s max)    |
| **Fallback Polling**  | Poll mỗi 5 phút để đảm bảo sync khi SSE miss                     |
| **Heartbeat**         | Server gửi heartbeat mỗi 25s để giữ connection qua proxy/nginx    |
| **Dead Connection Cleanup** | Tự dọn dẹp các controller đã đóng khi emit                 |
| **Metadata Deep Link**| Click thông báo → navigate thẳng tới task/project/comment tương ứng|
