# 📘 AUTHORIZATION RULES

Quy tắc tổ chức phân quyền (RBAC + ABAC)

---

# 1. Mục tiêu

Tài liệu này định nghĩa quy tắc tổ chức và triển khai hệ thống phân quyền theo mô hình:

* **RBAC** (Role-Based Access Control)
* **ABAC** (Attribute-Based Access Control)

Mục tiêu:

* Code sạch
* Không lặp logic
* Không trộn business logic với permission
* Dễ mở rộng khi thêm role hoặc rule mới
* Dễ test

---

# 2. Nguyên tắc kiến trúc

## 2.1 Tách rõ 4 tầng

| Layer          | Trách nhiệm              |
| -------------- | ------------------------ |
| Authentication | Xác thực người dùng      |
| RBAC           | Kiểm tra quyền theo role |
| ABAC (Policy)  | Kiểm tra theo thuộc tính |
| Service        | Xử lý business logic     |

---

## 2.2 Flow chuẩn

```
Request
   ↓
Authentication
   ↓
RBAC check
   ↓
Load resource
   ↓
ABAC check
   ↓
Service logic
   ↓
Response
```

---

# 3. Cấu trúc thư mục chuẩn

```
src/
 ├── auth/
 │    ├── rbac.ts
 │    ├── ability.ts
 │    ├── guard.ts
 │
 ├── modules/
 │    ├── task/
 │    │    ├── task.service.ts
 │    │    ├── task.repository.ts
 │    │    ├── task.policy.ts
 │
 ├── app/
 │    └── api/
```

---

# 4. Quy tắc RBAC

## 4.1 Role là gì?

Role đại diện cho cấp quyền tổng quát:

* ADMIN
* MANAGER
* MEMBER

---

## 4.2 Role chỉ quyết định "được phép làm gì ở mức cao"

Ví dụ:

* task:create
* task:update
* task:delete
* project:view

---

## 4.3 Không viết role check trực tiếp trong controller

❌ Sai:

```ts
if (user.role === 'ADMIN') { ... }
```

✅ Đúng:

```ts
requirePermission(user, 'task:update')
```

---

## 4.4 RBAC chỉ check permission string

RBAC KHÔNG được:

* Kiểm tra ownership
* Kiểm tra assignee
* Kiểm tra trạng thái task

Những việc đó thuộc ABAC.

---

# 5. Quy tắc ABAC (Policy Layer)

## 5.1 Policy là gì?

Policy là các rule kiểm tra dựa trên:

* user.id
* resource.ownerId
* resource.projectId
* trạng thái
* deadline
* phòng ban
* quan hệ giữa các entity

---

## 5.2 Mỗi module phải có policy riêng

Ví dụ:

```
task.policy.ts
project.policy.ts
comment.policy.ts
```

---

## 5.3 Policy không được:

* Gọi API
* Viết business logic
* Ghi log
* Thay đổi dữ liệu

Policy chỉ trả về:

```
true | false
```

---

## 5.4 Ví dụ policy chuẩn

```ts
export function canUpdateTask(user, task) {
  if (user.role === 'ADMIN') return true;

  if (task.assigneeId === user.id) return true;

  if (task.project.ownerId === user.id) return true;

  return false;
}
```

---

# 6. Guard Layer

Guard có nhiệm vụ:

* Kết hợp RBAC + ABAC
* Throw error nếu không hợp lệ

Ví dụ:

```ts
requirePermission(user, 'task:update')

if (!canUpdateTask(user, task)) {
  throw new ForbiddenError()
}
```

---

# 7. Quy tắc bắt buộc

## 7.1 Không viết permission logic trong:

* Controller
* Service
* Repository

---

## 7.2 Service chỉ làm business

Service không check role:

❌ Sai:

```ts
if (user.role !== 'ADMIN') throw Error()
```

---

## 7.3 Không hardcode role string rải rác

Phải dùng:

* enum Role
* constants
* permission map

---

## 7.4 Không lặp permission string

Permission phải được định nghĩa tập trung:

```
auth/rbac.ts
```

---

# 8. Thêm role mới phải làm gì?

Khi thêm role mới:

1. Thêm vào enum Role
2. Cập nhật rbac.ts
3. Nếu cần → thêm rule trong policy
4. Không sửa controller

---

# 9. Thêm rule mới phải làm gì?

Ví dụ:

> Không cho update task đã DONE

Chỉ sửa:

```
task.policy.ts
```

Không sửa service.

---

# 10. Testing Rule

## 10.1 Test RBAC riêng

* Test từng permission string
* Test từng role

## 10.2 Test Policy riêng

* Mock user
* Mock resource
* Test từng tình huống

---

# 11. Khi nào dùng thư viện ngoài?

Nếu hệ thống lớn, nhiều rule phức tạp, có thể dùng:

* CASL

Nhưng với hệ thống quản lý công việc vừa và nhỏ:

→ Viết policy thuần sẽ dễ debug và kiểm soát hơn.

---

# 12. Anti-pattern (Tuyệt đối tránh)

❌ Check role trong JSX
❌ Check role trực tiếp trong API
❌ Gộp RBAC và ABAC vào một file
❌ Viết điều kiện lồng nhau 10 cấp
❌ Lặp lại logic permission ở nhiều nơi

---

# 13. Chuẩn production

Một API update chuẩn:

```
1. requirePermission()
2. load resource
3. canXxxPolicy()
4. call service
```

Controller phải mỏng.
Policy phải thuần.
Service phải sạch.

---

# 14. Kết luận

Một hệ thống phân quyền sạch sẽ có đặc điểm:

* Role chỉ quyết định "được làm loại hành động gì"
* Policy quyết định "được làm trên resource nào"
* Service không biết gì về permission
* Controller không chứa business logic
* Mọi rule đều có thể test độc lập
