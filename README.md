# WorkSphere - Nền tảng Quản lý Công việc & Dự án

Kiến trúc: **Next.js 16, React 19, TypeScript, Tailwind CSS v4, MySQL 8+, Prisma, NextAuth.js v5.**

## 🚀 Hướng Dẫn Cài Đặt Nhanh

**Yêu cầu:** Node.js v20.x+ và MySQL Server v8.0+ (có thể dùng XAMPP).

### 1. Cài đặt thư viện

```bash
git clone <repository-url>
cd worksphere
npm install
```

### 2. Cấu hình Database (.env)

Tạo một bảng Database trống trong MySQL:
```sql
CREATE DATABASE worksphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tạo file `.env` tại thư mục gốc dự án và dán nội dung sau:
```env
# Sửa root/password theo DB MySQL máy bạn (XAMPP thường để pass rỗng)
DATABASE_URL="mysql://root:@localhost:3306/worksphere"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="worksphere-super-secret-key-2026"
```

### 3. Khởi tạo Cơ sở dữ liệu (Database)

Bạn có thể chọn **1 trong 2 cách** sau để khởi tạo cấu trúc và dữ liệu mẫu:

**Cách 1: Sử dụng Công cụ dòng lệnh Prisma (Chuẩn Developer)**
Chạy lần lượt 2 lệnh sau để hệ thống tự quét Code, tạo Database và Sinh tài khoản Admin:
```bash
npx prisma db push
npx prisma db seed
```
*(Yêu cầu: Nếu bị lỗi thiếu thư viện tsx để chạy seed, hãy chạy `npm install -g tsx` trước)*

**Cách 2: Dùng file DB Export sẵn**
1. Tìm file SQL tại đường dẫn: `database/worksphere.sql`.
2. Mở trình quản lý MySQL (ví dụ **phpMyAdmin** trên XAMPP), chọn database `worksphere` vừa tạo ở Bước 2.
3. Chọn thẻ **Import** (Nhập), nhấn **Choose File** và chọn file `database/worksphere.sql`.
4. Nhấn **Import** (hoặc **Go**) để thực thi.
5. Sau khi import thành công, chạy lệnh sau ở Terminal để đồng bộ:
```bash
npx prisma generate
```

### 4. Chạy hệ thống

```bash
npm run dev
```

Truy cập trang chủ: **[http://localhost:3000](http://localhost:3000)**

**Tài khoản Admin hệ thống:**
- Email: `admin@worksphere.com`
- Mật khẩu: `admin123`

---

## 🛠 Cách Sửa Lỗi Thường Gặp

1. **Lỗi Prisma Client / Báo thiếu Module:** Cập nhật lại Code bằng cách chạy `npx prisma generate`
2. **Lỗi Access denied for user 'root':** Kiểm tra lại tài khoản, mật khẩu MySQL trong file `.env`. Đảm bảo Server MySQL đang chạy.
3. **Cổng 3000 báo lỗi đang sử dụng:** Đổi sang chạy bằng cổng khác: `npm run dev -- -p 3001`
4. **Cần làm mới (Xóa sạch) lại Database:** Chạy các lệnh: `npx prisma db push --force-reset` sau đó chạy `npx prisma db seed`
