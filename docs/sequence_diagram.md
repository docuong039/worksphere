# Worksphere - Danh sách Sequence Diagram cần vẽ

> **Tài liệu phân tích thiết kế hệ thống**  
> Dự án: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> Ngày cập nhật: 2026-01-15

---

## 📊 Phân biệt Activity Diagram vs Sequence Diagram

| Tiêu chí | Activity Diagram | Sequence Diagram |
|----------|------------------|------------------|
| **Focus** | Business flow, quyết định | Object interactions theo thời gian |
| **Thể hiện** | Các bước xử lý, conditions | Messages giữa objects/components |
| **Phù hợp cho** | Logic nghiệp vụ phức tạp | API calls, tương tác hệ thống |
| **Đã vẽ** | 15 diagrams | Cần xác định |

---

## 📋 Tiêu chí chọn Use Case để vẽ Sequence Diagram

Sequence Diagram được vẽ cho các UC có:
1. ✅ **Nhiều components tham gia** (Client → API → Service → Database)
2. ✅ **API calls phức tạp** (request/response chain)
3. ✅ **Tương tác với external services**
4. ✅ **Async operations** (notifications, background jobs)
5. ✅ **Critical business flows** cần thể hiện chi tiết

### Tiêu chí KHÔNG vẽ Sequence Diagram

- ❌ UC đã có Activity Diagram đầy đủ và không cần thêm chi tiết technical
- ❌ UC chỉ đơn giản CRUD 1 entity
- ❌ UC chỉ có 2 participants (Client-Server đơn giản)

---

## 🔄 So sánh với Activity Diagrams đã vẽ

| Activity Diagram | Có cần Sequence Diagram? | Lý do |
|------------------|-------------------------|-------|
| AD-01: Đăng nhập | ✅ **Có** | NextAuth flow phức tạp, JWT session |
| AD-02: Tạo người dùng | ❌ Không | Activity đã đủ chi tiết |
| AD-03: Tạo dự án | ✅ **Có** | Multi-step: create project + member |
| AD-04: Xóa dự án | ✅ **Có** | Cascade delete across tables |
| AD-05: Thêm thành viên | ❌ Không | Activity đã đủ |
| AD-06: Tạo công việc | ✅ **Có** | Nhiều services: task, audit, parent update |
| AD-07: Cập nhật công việc | ✅ **Có** | Optimistic lock, parent update, notify |
| AD-08: Thay đổi trạng thái | ✅ **Có** | Workflow service, status service |
| AD-09: Thêm bình luận | ✅ **Có** | Comment + Notification service |
| AD-10: Tải lên file | ❌ Không | File system đơn giản |
| AD-11: Sao chép công việc | ✅ **Có** | Recursive copy, cross-project |
| AD-12: Tìm kiếm toàn cục | ✅ **Có** | Multiple queries, permission filter |
| AD-13: Xuất dữ liệu | ❌ Không | Generate file đơn giản |
| AD-14: Cập nhật Role | ❌ Không | Activity đã đủ |
| AD-15: Cấu hình Workflow | ❌ Không | Activity đã đủ |

---

## 📝 Các Sequence Diagram BỔ SUNG (không có Activity)

Ngoài các UC đã có Activity Diagram, cần thêm Sequence Diagram cho:

| UC | Tên | Lý do cần Sequence Diagram |
|----|-----|---------------------------|
| UC-22 | Xem danh sách công việc | Query phức tạp với filters, permissions |
| UC-23 | Xem chi tiết công việc | Load nhiều related data |
| UC-42 | Xem danh sách thông báo | Realtime count, mark as read |
| UC-49 | Xem Dashboard | Aggregate nhiều queries |

---

## 📊 Tổng kết: 14 Sequence Diagrams cần vẽ

| # | Sequence Diagram | Use Case | Participants | Priority |
|---|------------------|----------|--------------|----------|
| 1 | **SD-01: Đăng nhập** | UC-01 | Client, NextAuth, API, DB | 🔴 Cao |
| 2 | **SD-02: Tạo dự án** | UC-10 | Client, API, ProjectService, DB | 🟡 TB |
| 3 | **SD-03: Xóa dự án** | UC-12 | Client, API, CascadeService, DB | 🟡 TB |
| 4 | **SD-04: Tạo công việc** | UC-24 | Client, API, TaskService, AuditService, DB | 🔴 Cao |
| 5 | **SD-05: Cập nhật công việc** | UC-25 | Client, API, TaskService, NotifyService, DB | 🔴 Cao |
| 6 | **SD-06: Thay đổi trạng thái** | UC-26 | Client, API, WorkflowService, TaskService, DB | 🔴 Cao |
| 7 | **SD-07: Thêm bình luận** | UC-30 | Client, API, CommentService, NotifyService, DB | 🟡 TB |
| 8 | **SD-08: Sao chép công việc** | UC-41 | Client, API, CopyService, DB | 🟡 TB |
| 9 | **SD-09: Tìm kiếm toàn cục** | UC-44 | Client, API, SearchService, DB | 🟡 TB |
| 10 | **SD-10: Xem danh sách công việc** | UC-22 | Client, API, TaskService, PermissionService, DB | 🟡 TB |
| 11 | **SD-11: Xem chi tiết công việc** | UC-23 | Client, API, TaskService, RelatedServices, DB | 🟡 TB |
| 12 | **SD-12: Xem thông báo** | UC-42 | Client, API, NotificationService, DB | 🟢 Thấp |
| 13 | **SD-13: Xem Dashboard** | UC-49 | Client, API, DashboardService, DB | 🟢 Thấp |
| 14 | **SD-14: Check Permission** | Common | Any, PermissionService, DB | 🔴 Cao |

---

## 📝 Chi tiết từng Sequence Diagram

---

### SD-01: Đăng nhập (UC-01)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-01 - Đăng nhập |
| **Participants** | Browser, NextAuth, AuthAPI, UserService, Database |
| **Priority** | 🔴 Cao |

**Messages chính:**
1. Browser → NextAuth: signIn(credentials)
2. NextAuth → AuthAPI: POST /api/auth/callback/credentials
3. AuthAPI → UserService: validateCredentials(email, password)
4. UserService → Database: SELECT user WHERE email
5. UserService → UserService: bcrypt.compare(password, hash)
6. UserService → AuthAPI: return user or null
7. AuthAPI → NextAuth: create JWT session
8. NextAuth → Browser: set cookie, redirect

---

### SD-02: Tạo dự án (UC-10)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-10 - Tạo dự án mới |
| **Participants** | Browser, API, ProjectService, PermissionService, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: POST /api/projects
2. API → PermissionService: checkPermission(userId, 'projects.create')
3. PermissionService → Database: SELECT role, permissions
4. API → ProjectService: createProject(data)
5. ProjectService → Database: INSERT project
6. ProjectService → Database: INSERT projectMember (creator as Manager)
7. API → Browser: return project

---

### SD-03: Xóa dự án (UC-12)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-12 - Xóa dự án |
| **Participants** | Browser, API, ProjectService, CascadeDelete, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: DELETE /api/projects/[id]
2. API → PermissionService: checkIsCreatorOrAdmin()
3. API → ProjectService: deleteProject(id)
4. ProjectService → CascadeDelete: deleteRelatedData(projectId)
5. CascadeDelete → Database: DELETE comments, attachments, watchers, tasks, versions, members
6. ProjectService → Database: DELETE project
7. API → Browser: return success

---

### SD-04: Tạo công việc (UC-24)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-24 - Tạo công việc mới |
| **Participants** | Browser, API, TaskService, AuditService, ParentUpdateService, Database |
| **Priority** | 🔴 Cao |

**Messages chính:**
1. Browser → API: POST /api/tasks
2. API → PermissionService: checkPermission('tasks.create')
3. API → TaskService: createTask(data)
4. TaskService → Database: SELECT MAX(taskNumber) WHERE projectId
5. TaskService → Database: INSERT task (taskNumber = max + 1)
6. TaskService → AuditService: logCreate(task)
7. AuditService → Database: INSERT auditLog
8. opt: if parentId exists
   - TaskService → ParentUpdateService: updateParentAttributes(parentId)
   - ParentUpdateService → Database: UPDATE parent task
9. API → Browser: return task

---

### SD-05: Cập nhật công việc (UC-25)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-25 - Cập nhật công việc |
| **Participants** | Browser, API, TaskService, OptimisticLock, AuditService, NotifyService, Database |
| **Priority** | 🔴 Cao |

**Messages chính:**
1. Browser → API: PATCH /api/tasks/[id] { data, version }
2. API → PermissionService: checkEditPermission(userId, task)
3. API → TaskService: updateTask(id, data, version)
4. TaskService → Database: SELECT version FROM task WHERE id
5. TaskService → OptimisticLock: validateVersion(clientVersion, dbVersion)
6. alt: version mismatch
   - TaskService → API: throw ConflictError
   - API → Browser: 409 Conflict
7. TaskService → Database: UPDATE task SET ... version = version + 1
8. TaskService → AuditService: logChanges(oldData, newData)
9. opt: if parentId
   - TaskService → ParentUpdateService: updateParentAttributes()
10. TaskService → NotifyService: notifyWatchers(taskId, changes)
11. NotifyService → Database: INSERT notifications
12. API → Browser: return updated task

---

### SD-06: Thay đổi trạng thái (UC-26)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-26 - Thay đổi trạng thái |
| **Participants** | Browser, API, WorkflowService, TaskService, Database |
| **Priority** | 🔴 Cao |

**Messages chính:**
1. Browser → API: PATCH /api/tasks/[id] { statusId }
2. API → TaskService: getTask(id)
3. TaskService → Database: SELECT task with tracker
4. API → WorkflowService: validateTransition(trackerId, roleId, fromStatus, toStatus)
5. WorkflowService → Database: SELECT FROM workflowTransition WHERE ...
6. alt: transition not allowed
   - WorkflowService → API: throw ForbiddenError
   - API → Browser: 403 Forbidden
7. API → TaskService: updateStatus(taskId, newStatusId)
8. TaskService → Database: SELECT status (get defaultDoneRatio)
9. TaskService → Database: UPDATE task SET statusId, doneRatio
10. opt: if parentId
    - TaskService → ParentUpdateService: recalculateParent()
11. API → Browser: return updated task

---

### SD-07: Thêm bình luận (UC-30)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-30 - Thêm bình luận |
| **Participants** | Browser, API, CommentService, NotifyService, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: POST /api/tasks/[id]/comments
2. API → CommentService: createComment(taskId, userId, content)
3. CommentService → Database: INSERT comment
4. CommentService → Database: UPDATE task SET updatedAt
5. CommentService → NotifyService: notifyWatchers(taskId, 'comment_added')
6. NotifyService → Database: SELECT watchers WHERE taskId
7. loop: for each watcher (except author)
   - NotifyService → Database: INSERT notification
8. API → Browser: return comment

---

### SD-08: Sao chép công việc (UC-41)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-41 - Sao chép công việc |
| **Participants** | Browser, API, CopyService, TaskService, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: POST /api/tasks/[id]/copy
2. API → PermissionService: checkPermission(targetProjectId, 'tasks.create')
3. API → CopyService: copyTask(sourceTaskId, targetProjectId, options)
4. CopyService → TaskService: createTask(copiedData)
5. TaskService → Database: INSERT new task
6. opt: if options.copySubtasks
   - CopyService → Database: SELECT subtasks WHERE parentId = sourceId
   - loop: for each subtask
     - CopyService → TaskService: createTask(subtaskData with new parentId)
7. API → Browser: return new task

---

### SD-09: Tìm kiếm toàn cục (UC-44)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-44 - Tìm kiếm toàn cục |
| **Participants** | Browser, API, SearchService, PermissionService, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: GET /api/search?q=keyword
2. API → SearchService: search(keyword, userId)
3. par: parallel search
   - SearchService → Database: SELECT tasks WHERE subject/description LIKE
   - SearchService → Database: SELECT projects WHERE name/identifier LIKE
   - SearchService → Database: SELECT comments WHERE content LIKE
4. SearchService → PermissionService: filterByPermissions(results, userId)
5. PermissionService → Database: SELECT user's projectIds
6. SearchService → SearchService: filter private tasks
7. SearchService → SearchService: group & sort results
8. API → Browser: return grouped results

---

### SD-10: Xem danh sách công việc (UC-22)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-22 - Xem danh sách công việc |
| **Participants** | Browser, API, TaskService, PermissionService, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: GET /api/tasks?filters
2. API → TaskService: getTasks(filters, userId)
3. TaskService → PermissionService: getVisibleProjects(userId)
4. PermissionService → Database: SELECT projectIds WHERE userId is member
5. TaskService → Database: SELECT tasks WHERE projectId IN visibleProjects AND filters
6. TaskService → TaskService: filter private tasks (only if creator/assignee)
7. TaskService → Database: COUNT total for pagination
8. API → Browser: return { tasks, total, page }

---

### SD-11: Xem chi tiết công việc (UC-23)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-23 - Xem chi tiết công việc |
| **Participants** | Browser, API, TaskService, Database |
| **Priority** | 🟡 Trung bình |

**Messages chính:**
1. Browser → API: GET /api/tasks/[id]
2. API → PermissionService: checkCanView(userId, taskId)
3. API → TaskService: getTaskDetail(id)
4. par: parallel load related data
   - TaskService → Database: SELECT task with relations
   - TaskService → Database: SELECT subtasks WHERE parentId
   - TaskService → Database: SELECT comments ORDER BY createdAt
   - TaskService → Database: SELECT attachments
   - TaskService → Database: SELECT watchers
   - TaskService → Database: SELECT auditLogs (history)
5. API → Browser: return task with all related data

---

### SD-12: Xem thông báo (UC-42)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-42 - Xem danh sách thông báo |
| **Participants** | Browser, API, NotificationService, Database |
| **Priority** | 🟢 Thấp |

**Messages chính:**
1. Browser → API: GET /api/notifications
2. API → NotificationService: getNotifications(userId)
3. NotificationService → Database: SELECT notifications WHERE userId ORDER BY createdAt DESC
4. NotificationService → Database: COUNT unread WHERE isRead = false
5. API → Browser: return { notifications, unreadCount }

---

### SD-13: Xem Dashboard (UC-49)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | UC-49 - Xem Dashboard |
| **Participants** | Browser, API, DashboardService, Database |
| **Priority** | 🟢 Thấp |

**Messages chính:**
1. Browser → API: GET /api/dashboard
2. API → DashboardService: getDashboardData(userId)
3. par: parallel queries
   - DashboardService → Database: SELECT tasks WHERE assigneeId = userId AND status = open
   - DashboardService → Database: SELECT tasks WHERE dueDate < NOW() AND status != closed
   - DashboardService → Database: SELECT tasks WHERE dueDate BETWEEN NOW() AND +7days
   - DashboardService → Database: SELECT recent updates/activities
   - DashboardService → Database: SELECT statistics (counts by status)
4. API → Browser: return dashboard data

---

### SD-14: Check Permission (Common Pattern)

| Thuộc tính | Giá trị |
|------------|---------|
| **Use Case** | Common - Được gọi từ nhiều UC |
| **Participants** | Caller, PermissionService, Database |
| **Priority** | 🔴 Cao |

**Messages chính:**
1. Caller → PermissionService: hasPermission(userId, projectId, permissionKey)
2. PermissionService → Database: SELECT user WHERE id (check isAdministrator)
3. alt: isAdministrator = true
   - PermissionService → Caller: return true (bypass)
4. PermissionService → Database: SELECT roleId FROM projectMember WHERE userId, projectId
5. PermissionService → Database: SELECT permissions FROM rolePermission WHERE roleId
6. PermissionService → PermissionService: check permissionKey in permissions
7. PermissionService → Caller: return true/false

---

## 📈 Tổng hợp theo Module

| Module | Số Sequence Diagrams | IDs |
|--------|---------------------|-----|
| Authentication | 1 | SD-01 |
| Project Management | 2 | SD-02, SD-03 |
| Task Management | 5 | SD-04, SD-05, SD-06, SD-10, SD-11 |
| Comments | 1 | SD-07 |
| Task Copy | 1 | SD-08 |
| Search | 1 | SD-09 |
| Notifications | 1 | SD-12 |
| Dashboard | 1 | SD-13 |
| Common/Shared | 1 | SD-14 |
| **TỔNG CỘNG** | **14** | |

---

## 🔧 Trạng thái vẽ

| # | Tên Sequence Diagram | Use Case | Trạng thái |
|---|---------------------|----------|------------|
| 1 | SD-01: Đăng nhập | UC-01 | ⬜ Chưa vẽ |
| 2 | SD-02: Tạo dự án | UC-10 | ⬜ Chưa vẽ |
| 3 | SD-03: Xóa dự án | UC-12 | ⬜ Chưa vẽ |
| 4 | SD-04: Tạo công việc | UC-24 | ⬜ Chưa vẽ |
| 5 | SD-05: Cập nhật công việc | UC-25 | ⬜ Chưa vẽ |
| 6 | SD-06: Thay đổi trạng thái | UC-26 | ⬜ Chưa vẽ |
| 7 | SD-07: Thêm bình luận | UC-30 | ⬜ Chưa vẽ |
| 8 | SD-08: Sao chép công việc | UC-41 | ⬜ Chưa vẽ |
| 9 | SD-09: Tìm kiếm toàn cục | UC-44 | ⬜ Chưa vẽ |
| 10 | SD-10: Xem danh sách công việc | UC-22 | ⬜ Chưa vẽ |
| 11 | SD-11: Xem chi tiết công việc | UC-23 | ⬜ Chưa vẽ |
| 12 | SD-12: Xem thông báo | UC-42 | ⬜ Chưa vẽ |
| 13 | SD-13: Xem Dashboard | UC-49 | ⬜ Chưa vẽ |
| 14 | SD-14: Check Permission | Common | ⬜ Chưa vẽ |

---

## 🎯 Priority vẽ

| Mức | Sequence Diagrams | Lý do |
|-----|-------------------|-------|
| 🔴 **Cao** | SD-01, SD-04, SD-05, SD-06, SD-14 | Core flows, Security, Workflow |
| 🟡 **Trung bình** | SD-02, SD-03, SD-07, SD-08, SD-09, SD-10, SD-11 | Business operations |
| 🟢 **Thấp** | SD-12, SD-13 | Display/Read only |

---

*Tài liệu được tạo dựa trên phân tích 79 Use Cases và 15 Activity Diagrams của Worksphere*  
*Ngày tạo: 2026-01-15*
