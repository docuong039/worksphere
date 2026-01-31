# Thiết kế Cơ sở dữ liệu

Cơ sở dữ liệu của hệ thống được thiết kế sử dụng MySQL làm hệ quản trị cơ sở dữ liệu chính. Thiết kế tập trung vào việc quản lý toàn diện các khía cạnh của quản lý dự án bao gồm: quản lý người dùng và phân quyền (RBAC), tổ chức dự án đa cấp, theo dõi công việc (Issues/Tasks) linh hoạt với quy trình động (Workflows), kiểm soát phiên bản (Versions), ghi nhận thời gian (Time Tracking) và các hoạt động cộng tác nhóm. Cấu trúc dữ liệu được chuẩn hóa để đảm bảo tính toàn vẹn, khả năng mở rộng và tối ưu hóa hiệu năng cho các truy vấn phức tạp, với các mô hình chi tiết như sau:


## 1. Bảng Users (users)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã người dùng | PK, CUID |
| email | varchar(255) | Email người dùng | Not Null, Unique |
| name | varchar(255) | Tên người dùng | Not Null |
| password | varchar(255) | Mật khẩu (đã mã hóa) | Not Null |
| avatar | varchar(255) | Đường dẫn ảnh đại diện | Nullable |
| isAdministrator | boolean | Quyền quản trị hệ thống | Not Null, Default(false) |
| isActive | boolean | Trạng thái hoạt động | Not Null, Default(true) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 2. Bảng Roles (roles)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã vai trò | PK, CUID |
| name | varchar(255) | Tên vai trò | Not Null, Unique |
| description | text | Mô tả vai trò | Nullable |
| isActive | boolean | Trạng thái hoạt động | Not Null, Default(true) |
| assignable | boolean | Quyền được gán công việc | Not Null, Default(true) |
| canAssignToOther | boolean | Quyền gán việc cho người khác | Not Null, Default(true) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 3. Bảng RoleTrackers (role_trackers)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã quan hệ vai trò - loại việc | PK, CUID |
| roleId | varchar(255) | Mã vai trò | Not Null, FK(roles) |
| trackerId | varchar(255) | Mã loại công việc | Not Null, FK(trackers) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 4. Bảng Permissions (permissions)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã quyền hạn | PK, CUID |
| key | varchar(255) | Khóa quyền hạn | Not Null, Unique |
| name | varchar(255) | Tên quyền hạn | Not Null |
| description | text | Mô tả quyền hạn | Nullable |
| module | varchar(255) | Module chức năng | Not Null |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 5. Bảng RolePermissions (role_permissions)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã quan hệ vai trò - quyền hạn | PK, CUID |
| roleId | varchar(255) | Mã vai trò | Not Null, FK(roles) |
| permissionId | varchar(255) | Mã quyền hạn | Not Null, FK(permissions) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 6. Bảng Trackers (trackers)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã loại công việc | PK, CUID |
| name | varchar(255) | Tên loại công việc | Not Null, Unique |
| description | text | Mô tả | Nullable |
| position | int | Vị trí sắp xếp | Not Null, Default(0) |
| isDefault | boolean | Là loại mặc định | Not Null, Default(false) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 7. Bảng ProjectTrackers (project_trackers)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã quan hệ dự án - loại việc | PK, CUID |
| projectId | varchar(255) | Mã dự án | Not Null, FK(projects) |
| trackerId | varchar(255) | Mã loại công việc | Not Null, FK(trackers) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 8. Bảng Statuses (statuses)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã trạng thái | PK, CUID |
| name | varchar(255) | Tên trạng thái | Not Null, Unique |
| description | text | Mô tả | Nullable |
| position | int | Vị trí sắp xếp | Not Null, Default(0) |
| isClosed | boolean | Là trạng thái đóng | Not Null, Default(false) |
| isDefault | boolean | Là trạng thái mặc định | Not Null, Default(false) |
| defaultDoneRatio | int | Tỷ lệ hoàn thành mặc định | Nullable |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 9. Bảng Priorities (priorities)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã độ ưu tiên | PK, CUID |
| name | varchar(255) | Tên độ ưu tiên | Not Null, Unique |
| position | int | Vị trí sắp xếp | Not Null, Default(0) |
| color | varchar(255) | Mã màu | Nullable |
| isDefault | boolean | Là độ ưu tiên mặc định | Not Null, Default(false) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 10. Bảng WorkflowTransitions (workflow_transitions)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã chuyển đổi quy trình | PK, CUID |
| trackerId | varchar(255) | Mã loại công việc | Not Null, FK(trackers) |
| roleId | varchar(255) | Mã vai trò | Nullable, FK(roles) |
| fromStatusId | varchar(255) | Mã trạng thái nguồn | Not Null, FK(statuses) |
| toStatusId | varchar(255) | Mã trạng thái đích | Not Null, FK(statuses) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 11. Bảng Projects (projects)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã dự án | PK, CUID |
| name | varchar(255) | Tên dự án | Not Null |
| description | text | Mô tả dự án | Nullable |
| identifier | varchar(255) | Mã định danh dự án | Not Null, Unique |
| startDate | datetime | Ngày bắt đầu | Nullable |
| endDate | datetime | Ngày kết thúc | Nullable |
| isArchived | boolean | Trạng thái lưu trữ | Not Null, Default(false) |
| isPublic | boolean | Trạng thái công khai | Not Null, Default(false) |
| creatorId | varchar(255) | Người tạo dự án | Not Null, FK(users) |
| parentId | varchar(255) | Dự án cha | Nullable, FK(projects) |
| parentIssueDates | varchar(255) | Cài đặt ngày công việc cha | Not Null, Default("calculated") |
| parentIssuePriority | varchar(255) | Cài đặt ưu tiên công việc cha | Not Null, Default("calculated") |
| parentIssueDoneRatio | varchar(255) | Cài đặt tiến độ công việc cha | Not Null, Default("calculated") |
| parentIssueEstimatedHours | varchar(255) | Cài đặt giờ ước tính việc cha | Not Null, Default("calculated") |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 12. Bảng ProjectMembers (project_members)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã thành viên dự án | PK, CUID |
| projectId | varchar(255) | Mã dự án | Not Null, FK(projects) |
| userId | varchar(255) | Mã người dùng | Not Null, FK(users) |
| roleId | varchar(255) | Mã vai trò trong dự án | Not Null, FK(roles) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 13. Bảng MemberNotificationSettings (member_notification_settings)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã cài đặt thông báo | PK, CUID |
| projectMemberId | varchar(255) | Mã thành viên dự án | Not Null, Unique, FK(project_members) |
| notifyOnNew | boolean | Thông báo khi có việc mới | Not Null, Default(true) |
| notifyOnUpdate | boolean | Thông báo khi cập nhật việc | Not Null, Default(true) |
| notifyOnClose | boolean | Thông báo khi đóng việc | Not Null, Default(true) |
| notifyOnNote | boolean | Thông báo khi có ghi chú | Not Null, Default(true) |
| notifyOnAssign | boolean | Thông báo khi được gán việc | Not Null, Default(true) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 14. Bảng Versions (versions)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã phiên bản/chặng | PK, CUID |
| name | varchar(255) | Tên phiên bản | Not Null |
| description | text | Mô tả phiên bản | Nullable |
| status | varchar(255) | Trạng thái (open, locked, closed) | Not Null, Default("open") |
| dueDate | datetime | Ngày đến hạn | Nullable |
| projectId | varchar(255) | Mã dự án | Not Null, FK(projects) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 15. Bảng Tasks (tasks)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã công việc | PK, CUID |
| number | int | Số hiệu công việc | Not Null, Unique, Auto Increment |
| title | varchar(255) | Tiêu đề công việc | Not Null |
| description | text | Mô tả chi tiết | Nullable |
| trackerId | varchar(255) | Mã loại công việc | Not Null, FK(trackers) |
| statusId | varchar(255) | Mã trạng thái | Not Null, FK(statuses) |
| priorityId | varchar(255) | Mã độ ưu tiên | Not Null, FK(priorities) |
| projectId | varchar(255) | Mã dự án | Not Null, FK(projects) |
| assigneeId | varchar(255) | Người được giao việc | Nullable, FK(users) |
| creatorId | varchar(255) | Người tạo việc | Not Null, FK(users) |
| parentId | varchar(255) | Công việc cha | Nullable, FK(tasks) |
| versionId | varchar(255) | Phiên bản liên quan | Nullable, FK(versions) |
| path | varchar(255) | Đường dẫn phân cấp | Nullable |
| level | int | Cấp độ phân cấp | Not Null, Default(0) |
| estimatedHours | float | Số giờ ước tính | Nullable |
| doneRatio | int | Tỷ lệ hoàn thành (%) | Not Null, Default(0) |
| startDate | datetime | Ngày bắt đầu | Nullable |
| dueDate | datetime | Ngày kết thúc | Nullable |
| isPrivate | boolean | Là công việc riêng tư | Not Null, Default(false) |
| lockVersion | int | Phiên bản khóa (optimistic locking) | Not Null, Default(0) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 16. Bảng IssueRelations (issue_relations)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã liên kết công việc | PK, CUID |
| issueFromId | varchar(255) | Mã công việc nguồn | Not Null, FK(tasks) |
| issueToId | varchar(255) | Mã công việc đích | Not Null, FK(tasks) |
| relationType | varchar(255) | Loại liên kết | Not Null |
| delay | int | Độ trễ (ngày) | Nullable |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 17. Bảng Watchers (watchers)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã người theo dõi | PK, CUID |
| taskId | varchar(255) | Mã công việc | Not Null, FK(tasks) |
| userId | varchar(255) | Mã người dùng | Not Null, FK(users) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 18. Bảng Comments (comments)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã bình luận | PK, CUID |
| content | text | Nội dung bình luận | Not Null |
| taskId | varchar(255) | Mã công việc | Not Null, FK(tasks) |
| userId | varchar(255) | Người bình luận | Not Null, FK(users) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 19. Bảng Attachments (attachments)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã tệp đính kèm | PK, CUID |
| filename | varchar(255) | Tên tệp | Not Null |
| path | varchar(255) | Đường dẫn lưu trữ | Not Null |
| size | int | Kích thước tệp (bytes) | Not Null |
| mimeType | varchar(255) | Định dạng tệp (MIME) | Not Null |
| taskId | varchar(255) | Mã công việc | Not Null, FK(tasks) |
| userId | varchar(255) | Người tải lên | Not Null, FK(users) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 20. Bảng Notifications (notifications)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã thông báo | PK, CUID |
| type | varchar(255) | Loại thông báo | Not Null |
| title | varchar(255) | Tiêu đề thông báo | Not Null |
| message | text | Nội dung thông báo | Not Null |
| isRead | boolean | Trạng thái đã đọc | Not Null, Default(false) |
| userId | varchar(255) | Người nhận | Not Null, FK(users) |
| metadata | json | Dữ liệu bổ sung | Nullable |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 21. Bảng AuditLogs (audit_logs)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã nhật ký hệ thống | PK, CUID |
| action | varchar(255) | Hành động thực hiện | Not Null |
| entityType | varchar(255) | Loại đối tượng | Not Null |
| entityId | varchar(255) | Mã đối tượng | Not Null |
| changes | json | Chi tiết thay đổi | Nullable |
| userId | varchar(255) | Người thực hiện | Not Null, FK(users) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |

## 22. Bảng Queries (queries)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã truy vấn đã lưu | PK, CUID |
| name | varchar(255) | Tên truy vấn | Not Null |
| projectId | varchar(255) | Nhóm dự án | Nullable, FK(projects) |
| userId | varchar(255) | Người tạo | Not Null, FK(users) |
| isPublic | boolean | Chia sẻ công khai | Not Null, Default(false) |
| filters | text | Bộ lọc (JSON) | Not Null |
| columns | text | Cột hiển thị (JSON) | Nullable |
| sortBy | varchar(255) | Sắp xếp theo cột | Nullable |
| sortOrder | varchar(255) | Thứ tự sắp xếp (asc/desc) | Nullable, Default("asc") |
| groupBy | varchar(255) | Nhóm theo cột | Nullable |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 23. Bảng TimeEntryActivities (time_entry_activities)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã loại hoạt động | PK, CUID |
| name | varchar(255) | Tên hoạt động | Not Null, Unique |
| position | int | Vị trí hiển thị | Not Null, Default(0) |
| isDefault | boolean | Mặc định | Not Null, Default(false) |
| isActive | boolean | Trạng thái hoạt động | Not Null, Default(true) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |

## 24. Bảng TimeLogs (time_logs)
| Tên trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
| --- | --- | --- | --- |
| id | varchar(255) | Mã bản ghi thời gian | PK, CUID |
| hours | float | Số giờ | Not Null |
| comments | text | Ghi chú | Nullable |
| spentOn | datetime | Ngày thực hiện | Not Null |
| userId | varchar(255) | Người ghi nhận | Not Null, FK(users) |
| taskId | varchar(255) | Mã công việc | Nullable, FK(tasks) |
| projectId | varchar(255) | Mã dự án | Not Null, FK(projects) |
| activityId | varchar(255) | Mã loại hoạt động | Not Null, FK(time_entry_activities) |
| createdAt | datetime | Thời gian tạo | Not Null, Default(now()) |
| updatedAt | datetime | Thời gian cập nhật | Not Null |
