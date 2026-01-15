# Worksphere - Danh sách Use Cases

> **Tài liệu phân tích thiết kế hệ thống**  
> Dự án: Worksphere - Hệ thống Quản lý Công việc & Dự án  
> Ngày cập nhật: 2026-01-15

---

## 📋 Tổng quan Actors (Tác nhân)

| Actor | Mô tả |
|-------|-------|
| **User** | Người dùng đã đăng nhập. Quyền được xác định bởi **Role** được gán trong từng **Project**. |
| **Administrator** | Quản trị viên hệ thống (`isAdministrator = true`). Bypass tất cả permission checks, có toàn quyền. |

### 🔐 Hệ thống Phân quyền (RBAC động)

Worksphere sử dụng hệ thống **Role-Based Access Control (RBAC)** linh hoạt:

- **Role có thể tự tạo**: Administrator có thể tạo, sửa, xóa các Role
- **Permission gán cho Role**: Mỗi Role được gán một tập các Permissions
- **User có Role trong Project**: Mỗi User khi tham gia Project sẽ được gán một Role
- **Quyền theo ngữ cảnh Project**: User có thể có Role khác nhau trong các Project khác nhau
- **Creator đặc biệt**: Người tạo project tự động có quyền quản lý project đó

**Các permission quan trọng:**
- `projects.create` - Tạo dự án mới
- `projects.manage_members` - Quản lý thành viên dự án
- `projects.manage_versions` - Quản lý phiên bản/milestone
- `projects.manage_trackers` - Quản lý loại công việc trong dự án
- `tasks.create` - Tạo công việc mới
- `tasks.edit_own` - Sửa công việc do mình tạo
- `tasks.edit_any` - Sửa bất kỳ công việc nào
- `tasks.move` - Di chuyển công việc sang dự án khác
- `tasks.manage_relations` - Quản lý quan hệ giữa các công việc
- `queries.manage_public` - Tạo bộ lọc công khai

> **Lưu ý:** Trong các Use Case bên dưới, "người dùng có quyền" nghĩa là User có Role được cấp Permission tương ứng trong Project đó.

---

## 🔐 Module 1: Xác thực (Authentication)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-01 | Đăng nhập | Người dùng nhập email và mật khẩu để đăng nhập vào hệ thống. Hệ thống xác thực thông tin qua NextAuth và tạo phiên làm việc (JWT session). |
| UC-02 | Đăng xuất | Người dùng kết thúc phiên làm việc và thoát khỏi hệ thống. |
| UC-03 | Xem thông tin tài khoản | Người dùng xem thông tin cá nhân của mình (tên, email, avatar) và danh sách các dự án đang tham gia. |

---

## 👥 Module 2: Quản lý Người dùng (User Management) - Admin Only

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-04 | Xem danh sách người dùng | Administrator xem danh sách tất cả người dùng trong hệ thống với phân trang và tìm kiếm. |
| UC-05 | Tạo người dùng mới | Administrator tạo tài khoản mới với email, tên, mật khẩu. Mật khẩu được hash bằng bcrypt. |
| UC-06 | Cập nhật thông tin người dùng | Administrator chỉnh sửa thông tin người dùng bao gồm tên, email, mật khẩu, trạng thái hoạt động, quyền admin. |
| UC-07 | Xóa người dùng | Administrator xóa người dùng khỏi hệ thống. Không thể xóa user đang có task được gán. |

---

## 📁 Module 3: Quản lý Dự án (Project Management)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-08 | Xem danh sách dự án | Người dùng xem danh sách dự án mình là thành viên (Admin xem tất cả). Hỗ trợ lọc theo trạng thái và tìm kiếm. |
| UC-09 | Xem chi tiết dự án | Người dùng xem thông tin chi tiết dự án: mô tả, ngày, danh sách thành viên, thống kê công việc. |
| UC-10 | Tạo dự án mới | Người dùng có quyền `projects.create` tạo dự án với tên, mã định danh duy nhất, mô tả, ngày. Người tạo tự động làm Manager. |
| UC-11 | Cập nhật thông tin dự án | Người tạo dự án hoặc Admin chỉnh sửa thông tin dự án: tên, mô tả, ngày, trạng thái lưu trữ. |
| UC-12 | Xóa dự án | Người tạo dự án hoặc Admin xóa vĩnh viễn dự án. Xóa cascade: comments, attachments, watchers, tasks, members. |

---

## 👤 Module 4: Quản lý Thành viên Dự án (Project Members)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-13 | Xem danh sách thành viên | Thành viên dự án xem danh sách tất cả thành viên cùng vai trò của họ. |
| UC-14 | Thêm thành viên vào dự án | Người dùng có quyền `projects.manage_members` thêm một hoặc nhiều người dùng vào dự án với vai trò được chọn. |
| UC-15 | Thay đổi vai trò thành viên | Người dùng có quyền thay đổi vai trò của thành viên trong dự án. |
| UC-16 | Xóa thành viên khỏi dự án | Người dùng có quyền xóa thành viên khỏi dự án. |

---

## 🎯 Module 5: Quản lý Phiên bản (Versions/Milestones)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-17 | Xem danh sách phiên bản | Thành viên dự án xem danh sách phiên bản với trạng thái (open/locked/closed), ngày đến hạn, tiến độ. |
| UC-18 | Tạo phiên bản mới | Người dùng có quyền `projects.manage_versions` tạo phiên bản với tên, mô tả, ngày đến hạn. |
| UC-19 | Cập nhật phiên bản | Người dùng có quyền chỉnh sửa phiên bản: tên, mô tả, ngày, trạng thái (open → locked → closed). |
| UC-20 | Xóa phiên bản | Người dùng có quyền xóa phiên bản. Công việc thuộc phiên bản sẽ có versionId = null. |
| UC-21 | Xem Roadmap | Người dùng xem lộ trình: phiên bản với công việc được nhóm, tiến độ và backlog. |

---

## ✅ Module 6: Quản lý Công việc (Task Management)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-22 | Xem danh sách công việc | Người dùng xem danh sách công việc. Hỗ trợ: phân trang, lọc (trạng thái, ưu tiên, loại, người gán, phiên bản, danh mục, ngày), tìm kiếm theo tiêu đề/mô tả. Task private chỉ hiển thị cho creator/assignee. |
| UC-23 | Xem chi tiết công việc | Người dùng xem thông tin đầy đủ: thuộc tính, mô tả, công việc con, quan hệ, bình luận, file đính kèm, lịch sử, người theo dõi. |
| UC-24 | Tạo công việc mới | Người dùng có quyền `tasks.create` tạo công việc với tất cả thuộc tính. Khi có parentId thì là subtask. Số hiệu (#) tự động tăng. |
| UC-25 | Cập nhật công việc | Người dùng có quyền edit cập nhật thông tin. Thay đổi parentId để gán/hủy công việc cha. Hỗ trợ optimistic locking. |
| UC-26 | Thay đổi trạng thái | Người dùng thay đổi trạng thái theo workflow. Chỉ chuyển sang trạng thái được định nghĩa trong WorkflowTransition. |
| UC-27 | Gán công việc | Người dùng gán công việc cho thành viên. Role có `canAssignToOther=true` mới được gán cho người khác. |
| UC-28 | Xóa công việc | Người dùng có quyền xóa công việc và dữ liệu liên quan. Công việc cha được cập nhật lại. |

---

## 💬 Module 7: Bình luận (Comments)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-29 | Xem bình luận | Người dùng xem danh sách bình luận trên công việc, sắp xếp theo thời gian. |
| UC-30 | Thêm bình luận | Thành viên dự án thêm bình luận. Tự động cập nhật task và gửi thông báo cho watchers. |
| UC-31 | Sửa bình luận | Người viết bình luận sửa nội dung. |
| UC-32 | Xóa bình luận | Người viết hoặc Admin xóa bình luận. |

---

## 📎 Module 8: File đính kèm (Attachments)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-33 | Xem file đính kèm | Người dùng xem danh sách file: tên, kích thước, loại, người upload, ngày. |
| UC-34 | Tải lên file | Thành viên dự án upload file. Lưu với tên UUID trong `public/uploads`. |
| UC-35 | Tải xuống file | Người dùng tải file về máy. |
| UC-36 | Xóa file đính kèm | Người upload hoặc Admin xóa file. |

---

## 👁 Module 9: Theo dõi Công việc (Watchers)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-37 | Xem người theo dõi | Người dùng xem danh sách người đang theo dõi công việc. |
| UC-38 | Theo dõi công việc | Thành viên dự án đăng ký theo dõi để nhận thông báo. |
| UC-39 | Hủy theo dõi | Người dùng hủy theo dõi công việc. |
| UC-40 | Thêm người theo dõi khác | Người tạo task hoặc thành viên có thể thêm người khác (trong dự án) vào watcher. |

---

## 📋 Module 10: Sao chép Công việc

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-41 | Sao chép công việc | Hệ thống hiển thị form điền sẵn dữ liệu từ task gốc. Người dùng có thể chỉnh sửa các trường, chọn dự án đích và tùy chọn sao chép cả công việc con. |

---

## 🔔 Module 11: Thông báo (Notifications)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-42 | Xem danh sách thông báo | Người dùng xem thông báo của mình, lọc chưa đọc, số thông báo chưa đọc. |
| UC-43 | Đánh dấu đã đọc | Người dùng đánh dấu thông báo là đã đọc (một hoặc tất cả). |

---

## 🔍 Module 12: Tìm kiếm Toàn cục (Global Search)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-44 | Tìm kiếm toàn cục | Người dùng tìm kiếm trong toàn hệ thống (tasks, projects, comments, users). Non-admin chỉ thấy kết quả trong project mình là member. |

---

## 💾 Module 13: Bộ lọc đã lưu (Saved Queries)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-45 | Xem bộ lọc đã lưu | Người dùng xem danh sách bộ lọc: của mình và public. |
| UC-46 | Lưu bộ lọc mới | Người dùng lưu cấu hình lọc với tên, điều kiện, cột, sắp xếp. |
| UC-47 | Chia sẻ bộ lọc | người dùng tạo bộ lọc public nếu có quyền. |
| UC-48 | Xóa bộ lọc | Người sở hữu hoặc Admin xóa bộ lọc. |

---

## 📊 Module 14: Dashboard & Báo cáo (Reports)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-49 | Xem Dashboard | Người dùng xem tổng quan: task được gán, quá hạn, sắp đến hạn, hoạt động gần đây, thống kê. |
| UC-50 | Xem báo cáo tổng hợp | Người dùng xem thống kê: tổng dự án, tổng task, task mở/đóng, tỷ lệ hoàn thành. |
| UC-51 | Xem báo cáo theo dự án | Người dùng xem thống kê từng dự án. |
| UC-52 | Xem báo cáo theo người dùng | Administrator xem thống kê theo từng user. |
| UC-53 | Xuất dữ liệu CSV | Người dùng xuất danh sách công việc ra file CSV. |

---

## ⚙️ Module 15: Cấu hình Trackers - Admin Only

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-54 | Xem danh sách Tracker | Người dùng xem danh sách loại công việc (Bug, Feature, Task...). |
| UC-55 | Tạo Tracker | Administrator tạo loại công việc mới. |
| UC-56 | Cập nhật Tracker | Administrator chỉnh sửa tracker. |
| UC-57 | Xóa Tracker | Administrator xóa tracker (chỉ khi không có task sử dụng). |

---

## ⚙️ Module 17: Cấu hình Statuses - Admin Only

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-62 | Xem danh sách Status | Người dùng xem danh sách trạng thái. |
| UC-63 | Tạo Status | Administrator tạo trạng thái với tên, isClosed, defaultDoneRatio. |
| UC-64 | Cập nhật Status | Administrator chỉnh sửa trạng thái. |
| UC-65 | Xóa Status | Administrator xóa trạng thái (chỉ khi không có task sử dụng). |

---

## ⚙️ Module 18: Cấu hình Priorities - Admin Only

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-66 | Xem danh sách Priority | Người dùng xem danh sách độ ưu tiên với màu sắc. |
| UC-67 | Tạo Priority | Administrator tạo độ ưu tiên mới. |
| UC-68 | Cập nhật Priority | Administrator chỉnh sửa độ ưu tiên. |
| UC-69 | Xóa Priority | Administrator xóa độ ưu tiên (chỉ khi không có task sử dụng). |

---

## ⚙️ Module 19: Cấu hình Roles - Admin Only

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-70 | Xem danh sách Role | Người dùng xem danh sách vai trò kèm permissions. |
| UC-71 | Tạo Role | Administrator tạo vai trò mới với tên, assignable, canAssignToOther. |
| UC-72 | Cập nhật Role | Administrator chỉnh sửa vai trò và gán permissions. |
| UC-73 | Xóa Role | Administrator xóa vai trò (chỉ khi không có member sử dụng). |

---

## ⚙️ Module 20: Cấu hình Workflow - Admin Only

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-74 | Xem Workflow Matrix | Administrator xem ma trận workflow: trackers, statuses, roles và transitions. |
| UC-75 | Cấu hình Transition | Administrator định nghĩa chuyển đổi trạng thái cho (tracker, role). |

---

## ⚙️ Module 21: Cấu hình Quy tắc Task trong Dự án (Project Task Rules)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-76 | Cấu hình quy tắc tính toán | Quản lý dự án thiết lập quy tắc tính toán (Calculated/Independent) cho các thuộc tính của Task cha dựa trên Task con. |

---

## ⚙️ Module 22: Cấu hình Loại công việc cho Dự án (Project Trackers)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-79 | Xem Tracker của dự án | Xem danh sách các loại công việc (Bug, Feature...) được phép sử dụng trong dự án. |
| UC-80 | Chọn Tracker cho dự án | Quản lý dự án chọn/bỏ chọn các loại công việc áp dụng cho dự án. |

---

## 📜 Module 23: Nhật ký Hoạt động (Activity Log)

| STT | Tên Use Case | Mô tả |
|-----|--------------|-------|
| UC-81 | Xem hoạt động gần đây | Người dùng xem danh sách hoạt động trong các dự án mình là thành viên. |


---

## 📊 Tổng kết

| Module | Số Use Cases |
|--------|--------------|
| Xác thực | 3 |
| Quản lý Người dùng | 4 |
| Quản lý Dự án | 5 |
| Quản lý Thành viên | 4 |
| Quản lý Phiên bản | 5 |
| Quản lý Công việc | 7 |
| Bình luận | 4 |
| File đính kèm | 4 |
| Theo dõi Công việc | 4 |
| Sao chép Công việc | 1 |
| Thông báo | 2 |
| Tìm kiếm Toàn cục | 1 |
| Bộ lọc đã lưu | 4 |
| Dashboard & Báo cáo | 5 |
| Cấu hình Trackers | 4 |
| Cấu hình Statuses | 4 |
| Cấu hình Priorities | 4 |
| Cấu hình Roles | 4 |
| Cấu hình Workflow | 2 |
| Cấu hình Issue Tracking | 1 |
| Cấu hình Trackers/Dự án | 2 |
| Nhật ký Hoạt động | 1 |
| **TỔNG CỘNG** | **75** |

---

## 📝 Ghi chú quan trọng

1. **RBAC động**: Hệ thống phân quyền linh hoạt - Role và Permission có thể tự tạo và cấu hình.

2. **Administrator**: Có toàn quyền, bypass tất cả permission checks (`isAdministrator = true`).

3. **Creator đặc biệt**: Người tạo dự án luôn có quyền quản lý dự án đó.

4. **Quyền theo ngữ cảnh Project**: User có Role khác nhau trong các Project khác nhau.

5. **Workflow bắt buộc**: Chuyển đổi trạng thái task phải tuân theo WorkflowTransition.

6. **Subtask = Task có parentId**: Không có module riêng cho subtask, chỉ là task với field `parentId` được set.

7. **Tự động cập nhật cha**: Khi subtask thay đổi, hệ thống tự động tính lại thuộc tính task cha tùy cấu hình.

8. **Optimistic Locking**: Khi update task, kiểm tra version để tránh conflict.

9. **Private Task**: Task có `isPrivate=true` chỉ hiển thị cho creator và assignee.

10. **Soft Delete**: Project sử dụng `isArchived` thay vì xóa thực sự.

11. **Audit Trail**: Mọi thay đổi quan trọng được ghi vào bảng AuditLog.

---

*Tài liệu được tạo dựa trên phân tích mã nguồn thực tế của dự án Worksphere.*  
*Cập nhật lần cuối: 2026-01-15*
