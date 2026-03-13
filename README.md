# WorkSphere - Nền tảng Quản lý Công việc & Dự án

WorkSphere là một hệ thống quản lý công việc và dự án mạnh mẽ, linh hoạt được xây dựng trên nền tảng Web hiện đại. 

Hệ thống được thiết kế với kiến trúc **"Thin Controller, Fat Service"** đảm bảo tính bảo mật, dễ dàng mở rộng, và hoạt động mượt mà.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
- **Framework:** Next.js 16 (App Router), React 19
- **Ngôn ngữ:** TypeScript
- **Giao diện:** Tailwind CSS v4, Radix UI, Dnd-kit (Kéo thả)
- **Cơ sở dữ liệu:** MySQL 8+
- **ORM:** Prisma Client
- **Bảo mật:** NextAuth.js v5, Zod (Validation), bcryptjs

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN DÀNH CHO NGƯỜI MỚI

Nếu bạn mới tải dự án về, làm theo đúng các bước theo thứ tự dưới đây để chạy hệ thống thành công 100%.

### BƯỚC 1: Chuẩn bị Môi trường (Yêu cầu bắt buộc)
Bạn cần cài đặt các công cụ sau trước khi bắt đầu:
1. **Node.js:** Phiên bản `v20.x` trở lên. (Tải tại [nodejs.org](https://nodejs.org/)).
2. **Git:** (Tải tại [git-scm.com](https://git-scm.com/)).
3. **MySQL:** Hệ quản trị cơ sở dữ liệu MySQL Server (phiên bản `v8.0+`).
   *Gợi ý:* Nếu bạn dùng Windows, có thể cài đặt **XAMPP / Laragon** để có sẵn MySQL Server nhẹ và dễ dùng.

---

### BƯỚC 2: Tải Mã Nguồn & Cài Đặt Thư Viện
Mở Terminal (Command Prompt / PowerShell / Terminal của VSCode) và gõ các lệnh sau:

```bash
# 1. Clone dự án (hoặc giải nén thư mục nếu bạn có file zip)
git clone <đường-dẫn-repo>

# 2. Di chuyển vào thư mục dự án
cd worksphere

# 3. Cài đặt toàn bộ thư viện cần thiết
npm install
```

---

### BƯỚC 3: Cấu hình Cơ sở dữ liệu (Database)

Bạn cần tạo một Database trống trong MySQL:
1. Mở công cụ quản lý MySQL của bạn (như **phpMyAdmin**, **HeidiSQL**, **DBeaver**, hoặc MySQL Workbench).
2. Chạy câu lệnh SQL sau để tạo Database:
```sql
CREATE DATABASE worksphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### BƯỚC 4: Cấu hình Môi trường (.env)

Trong thư mục gốc của dự án, hãy tìm file `.env.example` (nếu có) và đổi tên nó thành `.env`. 
*(Hoặc tự tạo một file mới đặt tên đúng là `.env`)*.

Sau đó, dán nội dung sau vào file `.env`:

```env
# ==== CẤU HÌNH DATABASE ====
# Thay đổi username (root), password (mật khẩu rỗng), và port (3306) cho phù hợp với máy bạn
# Nếu dùng XAMPP mặc định (chưa đặt pass), link sẽ là như dưới đây:
DATABASE_URL="mysql://root:@localhost:3306/worksphere"

# Ví dụ nếu bạn đổi pass MySQL là 123456:
# DATABASE_URL="mysql://root:123456@localhost:3306/worksphere"


# ==== CẤU HÌNH BẢO MẬT HIÊN ĐĂNG NHẬP ====
# URL mặc định khi chạy ở local
NEXTAUTH_URL="http://localhost:3000"

# Chuỗi ngẫu nhiên để mã hóa phiên đăng nhập (Phiên bản dev không cần đổi cũng được)
NEXTAUTH_SECRET="worksphere-super-secret-key-2026-xyz123"
```

---

### BƯỚC 5: Đồng bộ Database & Sinh dữ liệu mẫu (Seed Data)

Đây là bước cực kỳ quan trọng để Prisma tạo các bảng trong Database MySQL của bạn và nhồi dữ liệu mẫu (Tài khoản Admin, Configurations,...).

Mở Terminal tại thư mục `worksphere` và chạy **lần lượt 2 lệnh sau**:

```bash
# 1. Để Prisma tự động tạo các bảng và cột trong MySQL (dựa trên schema.prisma)
npx prisma db push

# 2. Nạp dữ liệu cấu hình ban đầu và Tài khoản Admin mặc định
npx prisma db seed
```
*(Lưu ý: Nếu lệnh `seed` báo lỗi tsx thiếu, hãy chạy lệnh `npm install -g tsx` trước).*

---

### BƯỚC 6: Chạy Hệ Thống (Development Mode)

Sau khi hoàn tất cài đặt, bạn Khởi động server lập trình (Dev Server) bằng lệnh:

```bash
npm run dev
```

Server sẽ mất vài giây để khởi động. Khi thấy thông báo `Ready in ...` hoặc xanh la cây, hãy mở Trình duyệt Web của bạn (Chrome/Edge/Firefox) và truy cập địa chỉ:

👉 Trang chủ: **http://localhost:3000**

---

### BƯỚC 7: Đăng Nhập Tài Khoản Quản Trị Hệ Thống (Admin)
Hệ thống đã tự động tạo sẵn cho bạn một tài khoản Admin có toàn quyền nhất:

- **Email:** `admin@worksphere.com`
- **Mật khẩu:** `admin123`

Đăng nhập vào xong, bạn có thể tự do trải nghiệm phần Tạo dự án, Tạo luồng Workflow (Quy trình), Mời thành viên,...

---

## 🛠 Lỗi Thường Gặp & Cách Sửa Nhanh (Troubleshooting)

**1. Lỗi: PrismaClientInitializationError / Access denied for user 'root'**
* **Nguyên nhân**: Mật khẩu Database MySQL ở file `.env` bị sai, hoặc MySQL trên máy bạn đang không chạy.
* **Cách sửa**: Bật MySQL Server lên, kiểm tra lại cấu hình kết nối ở mục `DATABASE_URL` trong file `.env`. Đảm bảo điền đúng Pass.

**2. Lỗi: Prisma can't find module ... / TypeError**
* **Nguyên nhân**: Prisma chưa tạo mã client tương ứng sau khi Code thay đổi.
* **Cách sửa**: Chạy lệnh `npx prisma generate` ở terminal rồi chạy lại dự án.

**3. Lỗi: Cổng 3000 (Port 3000) đang bị sử dụng**
* **Nguyên nhân**: Bạn đang chạy ngầm một dự án React/Next khác (hoặc chính dự án bị treo).
* **Cách sửa**: Tắt mở lại. Mở PowerShell với Quyền Admin và gõ lệnh: `Stop-Process -Name node -Force ` (Tắt hết các server node). Hoặc bạn có thể chạy port khác bằng lệnh `npm run dev -- -p 3001`

**4. Reset Cơ Sở Dữ Liệu (Khi cần làm trắng hệ thống)**
Nếu bạn lỡ vọc nháp làm rác Database quá dơ, hãy chạy lệnh sau:
```bash
npx prisma db push --force-reset
npx prisma db seed
```
(Thao tác này sẽ XÓA TRẮNG bảng và tạo lại dữ liệu gốc ban đầu).

---

## 🏗️ Deployment (Đưa lên Internet)

Khi muốn biên dịch ra bảng tối ưu (production) để chạy trên VPS (Ubuntu/CentOS), hãy chạy:

```bash
# Chạy build lấy bản build tối ưu
npm run build 

# Chạy app (ở chế độ production nhanh, mạnh nhất)
npm run start
```

*Chúc bạn trải nghiệm và thao tác Dự án Worksphere thành công!*
