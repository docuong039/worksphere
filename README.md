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

### 3. Khởi tạo cấu trúc & Dữ liệu mẫu (Seed)

Chạy **lần lượt 2 lệnh** sau để tự động tạo bảng dữ liệu và Sinh tài khoản Admin:
```bash
npx prisma db push
npx prisma db seed
```
*(Yêu cầu: Nếu bị lỗi thiếu tsx, hãy chạy `npm install -g tsx`)*

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
