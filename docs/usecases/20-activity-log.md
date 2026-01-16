# Use Case Diagram 20: Nhật ký hoạt động (Activity Log)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Activity Log  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Activity Log |
| **Mô tả** | Chức năng xem lịch sử hoạt động |
| **Số Use Cases** | 1 |
| **Actors** | User, Administrator |
| **Source Files** | `src/app/api/activity/route.ts`, `src/lib/audit-log.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-70 - Xem nhật ký hoạt động

---

#### 1. Mô tả
Use Case này cho phép người dùng xem lịch sử các hoạt động trong hệ thống: tạo, sửa, xóa công việc và dự án. Kết quả được lọc theo quyền truy cập của người dùng.

#### 2. Tác nhân chính
- **User**: Xem hoạt động trong dự án mình là thành viên.
- **Administrator**: Xem tất cả hoạt động.

#### 3. Tác nhân phụ
- *Không có*

#### 4. Tiền điều kiện
- Người dùng đã đăng nhập vào hệ thống.

#### 5. Đảm bảo tối thiểu (Minimal Guarantee)
- Non-admin chỉ xem được hoạt động trong phạm vi dự án của mình.
- Private tasks được lọc cho non-creator/non-assignee.

#### 6. Đảm bảo thành công (Success Guarantee)
- Danh sách hoạt động được hiển thị với thông tin chi tiết entity.
- Pagination được áp dụng chính xác.

#### 7. Chuỗi sự kiện chính (Main Flow)
1. Người dùng truy cập trang Activity.
2. Hệ thống đọc query parameters:
   - `projectId`: lọc theo dự án cụ thể
   - `userId`: lọc theo người thực hiện
   - `type`: lọc theo loại (task, project)
   - `limit`: số lượng (mặc định 50)
   - `page`: trang (mặc định 1)
3. Hệ thống xây dựng where clause:
   - Nếu có entityType: lọc theo type.
   - Nếu có userId filter:
     - Non-admin chỉ được lọc chính mình (từ chối 403 nếu khác).
     - Admin: lọc bất kỳ userId.
   - Nếu có projectId:
     - Non-admin: kiểm tra là member của project (403 nếu không).
     - Tìm tất cả taskIds trong project.
     - Lọc: (entityType=project AND entityId=projectId) OR (entityType=task AND entityId IN taskIds).
   - Nếu không có projectId và non-admin:
     - Lấy danh sách projectIds của user.
     - Lấy taskIds trong các projects đó.
     - Lọc: (entityType=project AND entityId IN projectIds) OR (entityType=task AND entityId IN taskIds) OR (userId = currentUserId).
4. Hệ thống truy vấn song song:
   - AuditLog với pagination (skip, take).
   - Count total.
5. Hệ thống bulk fetch entity details:
   - Tất cả tasks (id, number, title, isPrivate, creatorId, assigneeId, project).
   - Tất cả projects (id, name).
6. Hệ thống enrich và filter:
   - Với mỗi activity:
     - Nếu entityType = 'task':
       - Lấy task từ tasksMap.
       - **SECURITY**: Nếu task.isPrivate và user không phải admin:
         - Kiểm tra creatorId hoặc assigneeId = currentUserId.
         - Nếu không: **loại bỏ activity này khỏi kết quả**.
       - Thêm entityDetails: { id, number, title, project }.
     - Nếu entityType = 'project':
       - Thêm entityDetails từ projectsMap.
   - Filter ra các null entries (private tasks đã loại bỏ).
7. Hệ thống trả về:
   - `activities`: danh sách enriched (đã filter).
   - `pagination`: { page, limit, total, totalPages }.
8. Hệ thống hiển thị danh sách hoạt động.
9. Kết thúc Use Case.

#### 8. Luồng thay thế (Alternative Flow)

**A1: Lọc theo dự án**
- Rẽ nhánh từ bước 2.
- Người dùng chọn dự án từ dropdown.
- Hệ thống kiểm tra quyền member (non-admin).
- Tiếp tục từ bước 3.

**A2: Lọc theo loại**
- Rẽ nhánh từ bước 2.
- Người dùng chọn type: task hoặc project.
- Tiếp tục từ bước 3.

#### 9. Luồng ngoại lệ (Exception Flow)

**E1: Không có quyền xem activity của người khác**
- Rẽ nhánh từ bước 3 (userId filter).
- Non-admin cố lọc userId khác.
- Hệ thống trả về lỗi 403: "Không có quyền xem activity của người khác".
- Kết thúc Use Case.

**E2: Không có quyền xem project**
- Rẽ nhánh từ bước 3 (projectId filter).
- Non-admin không phải member của project.
- Hệ thống trả về lỗi 403: "Không có quyền xem project này".
- Kết thúc Use Case.

#### 10. Ghi chú
- Private task filtering xảy ra SAU khi query, trong lúc enrich.
- Có thể có ít activities hơn limit do private tasks bị loại bỏ.

---

## 3. Các loại hoạt động

| Action | Mô tả | Tạo bởi |
|--------|-------|---------|
| created | Tạo mới entity | `logCreate()` |
| updated | Cập nhật entity (kèm oldValue, newValue) | `logUpdate()` |
| deleted | Xóa entity | `logDelete()` |

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Project Scope | Non-admin chỉ xem trong dự án mình là thành viên |
| BR-02 | Own Activity Included | Non-admin luôn xem được hoạt động của chính mình |
| BR-03 | Private Filter Post-Query | Private tasks được filter SAU khi query, trong enrich phase |
| BR-04 | Private Visibility | Private task chỉ hiển thị cho creator hoặc assignee |
| BR-05 | Bulk Fetch | Entity details được bulk fetch để tránh N+1 |
| BR-06 | Pagination | Hỗ trợ page và limit (mặc định: 1, 50) |
| BR-07 | Order DESC | Sắp xếp theo createdAt giảm dần |
| BR-08 | userId Filter Admin Only | Non-admin chỉ filter được chính mình |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/activity/route.ts` (179 dòng)
- [x] Confirmed: userId filter 403 cho non-admin xem người khác
- [x] Confirmed: projectId filter kiểm tra membership
- [x] Confirmed: Private task filtering trong enrich phase (Line 141-147)
- [x] Confirmed: Bulk fetch tasks và projects (Line 110-131)
- [x] Confirmed: OR logic cho non-admin scope

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
