# Use Case Diagram 14: Dashboard & Báo cáo (Dashboard & Reports)

> **Hệ thống**: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> **Module**: Dashboard & Reports  
> **Phiên bản**: 1.1  
> **Ngày cập nhật**: 2026-01-16

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên sơ đồ** | UC Diagram - Dashboard & Reports |
| **Mô tả** | Các chức năng xem dashboard và báo cáo |
| **Số Use Cases** | 2 |
| **Actors** | User, Administrator |
| **Source Files** | `src/app/api/dashboard/route.ts`, `src/app/api/reports/route.ts` |

---

## 2. Đặc tả Use Case chi tiết

---

### USE CASE: UC-49 - Xem Dashboard

---

#### 1. Mô tả
Xem trang tổng quan cá nhân với các thống kê và công việc liên quan.

#### 2. Tác nhân chính
- **User**: Người dùng đã đăng nhập.

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.

#### 4. Đảm bảo thành công (Success Guarantee)
- Dashboard hiển thị đầy đủ dữ liệu cá nhân hóa.

#### 5. Chuỗi sự kiện chính (Main Flow)
1. Người dùng truy cập trang chủ.
2. Hệ thống truy vấn song song:
   - **myTasks**: Công việc được gán cho user (chưa đóng, limit 10)
   - **overdueTasks**: Số công việc quá hạn (dueDate < now, chưa đóng)
   - **dueSoonTasks**: Số công việc đến hạn trong 7 ngày
   - **recentActivity**: Công việc cập nhật gần đây (limit 10)
   - **projects**: Top 5 dự án đang hoạt động
   - **tasksByStatus**: Thống kê công việc theo trạng thái
   - **unreadNotifications**: Số thông báo chưa đọc
3. Hệ thống lọc kết quả theo quyền:
   - Admin: tất cả dự án
   - User: chỉ dự án là thành viên
4. Hệ thống hiển thị dashboard với các widget.
5. Kết thúc Use Case.

#### 6. Ghi chú
- Dashboard được cá nhân hóa theo user.
- myTasks chỉ lấy công việc có assigneeId = userId.

---

### USE CASE: UC-50 - Xem Báo cáo

---

#### 1. Mô tả
Xem các loại báo cáo thống kê về công việc và dự án.

#### 2. Tác nhân chính
- **User**: Xem báo cáo summary và by-project.
- **Administrator**: Xem tất cả loại báo cáo bao gồm by-user.

#### 3. Tiền điều kiện
- Người dùng đã đăng nhập.

#### 4. Query Parameters

| Parameter | Mô tả |
|-----------|-------|
| type | Loại báo cáo: summary, by-project, by-user |
| projectId | Filter theo dự án (optional) |
| startDate | Ngày bắt đầu filter (optional) |
| endDate | Ngày kết thúc filter (optional) |

#### 5. Các loại báo cáo

**1. Summary Report (type=summary)**

Thống kê tổng quan:
- totalProjects: Số dự án đang hoạt động (isArchived=false)
- totalTasks: Tổng số công việc
- openTasks: Số công việc đang mở (status.isClosed=false)
- closedTasks: Số công việc đã đóng (status.isClosed=true)
- completionRate: Tỷ lệ hoàn thành = (closedTasks / totalTasks) * 100

Filter theo quyền:
- Admin: tất cả projects (hoặc filter by projectId nếu có)
- User: chỉ projects là thành viên

**2. By Project Report (type=by-project)**

Thống kê theo từng dự án:
- id, name: Thông tin dự án
- totalTasks: Số công việc
- totalMembers: Số thành viên
- openTasks, closedTasks: Công việc mở/đóng
- completionRate: Tỷ lệ hoàn thành

Filter:
- Chỉ lấy projects không archived
- Admin: tất cả projects
- User: projects là thành viên

**3. By User Report (type=by-user) - ADMIN ONLY**

Thống kê theo từng người dùng:
- id, name, email: Thông tin user
- totalAssigned: Số công việc được gán
- openTasks: Số công việc chưa đóng
- closedTasks: Số công việc đã đóng

Filter:
- Chỉ users active (isActive=true)
- Có thể filter by projectId

#### 6. Chuỗi sự kiện chính (Main Flow)
1. Người dùng truy cập trang Reports.
2. Người dùng chọn loại báo cáo và các filter.
3. Hệ thống kiểm tra loại báo cáo.
4. Nếu type = 'by-user':
   - Kiểm tra isAdmin.
   - Nếu không phải admin: từ chối 403.
5. Hệ thống xây dựng query filter theo quyền.
6. Hệ thống truy vấn và tính toán thống kê.
7. Hệ thống trả về: { type, data }.
8. Hiển thị báo cáo.
9. Kết thúc Use Case.

#### 7. Luồng ngoại lệ (Exception Flow)

**E1: Không có quyền xem báo cáo theo người dùng**
- Rẽ nhánh từ bước 4.
- Non-admin cố xem type=by-user.
- Hệ thống trả về lỗi 403: "Không có quyền truy cập".

**E2: Loại báo cáo không hợp lệ**
- Rẽ nhánh từ bước 3.
- type không phải summary, by-project, hoặc by-user.
- Hệ thống trả về lỗi 400: "Loại báo cáo không hợp lệ".

#### 8. Ghi chú
- completionRate được làm tròn bằng Math.round().
- by-user report có thể bị chậm nếu có nhiều users.

---

## 7. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| BR-01 | Personal Dashboard | Dashboard hiển thị dữ liệu liên quan đến người dùng |
| BR-02 | Project Filter | Non-admin chỉ thấy dự án mình là thành viên |
| BR-03 | Admin Only by-user | Báo cáo theo người dùng chỉ dành cho admin |
| BR-04 | Overdue Definition | Quá hạn = dueDate < now AND status.isClosed = false |
| BR-05 | Due Soon | Công việc đến hạn trong 7 ngày tới |
| BR-06 | CompletionRate Formula | completionRate = Math.round((closedTasks / totalTasks) * 100) |
| BR-07 | Active Projects | Chỉ tính projects có isArchived = false |
| BR-08 | Active Users | by-user chỉ tính users có isActive = true |

---

## 8. Validation Checklist

- [x] Đã đối chiếu với `src/app/api/reports/route.ts` (149 dòng)
- [x] Confirmed: 3 types = summary, by-project, by-user
- [x] Confirmed: by-user admin only (Line 110)
- [x] Confirmed: Project filter logic cho admin vs user
- [x] Confirmed: completionRate calculation (Line 60, 96)

---

*Tài liệu được tạo dựa trên phân tích mã nguồn Worksphere*  
*Ngày cập nhật: 2026-01-16*
