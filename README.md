# Worksphere - Hệ thống Quản lý Công việc & Dự án

Nền tảng quản lý dự án và công việc với Next.js 16, React 19, MySQL và Prisma.

## 🚀 Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, MySQL, Prisma, NextAuth.js v5

## 📋 Yêu cầu

- Node.js 20.x+
- MySQL 8.x+

## ⚡ Hướng dẫn chạy nhanh

### 1. Clone và cài đặt

```bash
git clone <repository-url>
cd worksphere
npm install
```

### 2. Tạo Database

```bash
mysql -u root -p -e "CREATE DATABASE worksphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. Cấu hình `.env`

Chỉnh sửa file `.env` (đã có sẵn):

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/worksphere"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
```

**Lưu ý:** Nếu dùng XAMPP mặc định (không có password), dùng:

```env
DATABASE_URL="mysql://root@localhost:3306/worksphere"
```

### 4. Setup Database

```bash
npx prisma db push
npx prisma db seed
```

### 5. Chạy dự án

```bash
npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000)

**Đăng nhập:**

- Email: `admin@worksphere.com`
- Password: `admin123`

---

## 🔧 Lệnh hữu ích

```bash
npm run dev              # Chạy dev server
npm run build           # Build production
npx prisma studio       # Xem database GUI
npx prisma db seed      # Seed data
npx prisma db push --force-reset  # Reset database
```

## 🐛 Xử lý lỗi

**Lỗi kết nối MySQL:** Kiểm tra MySQL đang chạy và thông tin trong `.env`

**Prisma Client error:** Chạy `npx prisma generate`

**Port 3000 bị chiếm:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📝 License

Proprietary and confidential.
