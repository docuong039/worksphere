# Worksphere - Hệ thống Quản lý Công việc & Dự án

Worksphere là một nền tảng quản lý dự án và công việc chuyên nghiệp, được xây dựng với các công nghệ hiện đại nhất, cho phép các đội ngũ cộng tác hiệu quả, theo dõi tiến độ và quản lý tài nguyên một cách tập trung.

## 🚀 Công nghệ sử dụng

- **Frontend:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS 4
- **Database:** MySQL
- **ORM:** Prisma
- **Icons:** Lucide React
- **Ngôn ngữ:** TypeScript

## 🛠 Hướng dẫn cài đặt và Chạy dự án

### 1. Yêu cầu hệ 
- **Node.js:** Phiên bản 20.x trở lên
- **MySQL:** Đang chạy cục bộ hoặc trên cloud

### 2. Cài đặt các thư viện phụ thuộc
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc và cấu hình các thông số sau (có thể tham khảo `.env.example` nếu có):
```env
# Kết nối cơ sở dữ liệu MySQL
DATABASE_URL="mysql://username:password@localhost:3306/worksphere"

# Bí mật cho Authentication (NextAuth)
# Bạn có thể tạo key bằng lệnh: npx auth secret
AUTH_SECRET="your_secret_key_here"
```
*Lưu ý: Thay thế `username`, `password` và `worksphere` bằng thông tin database thực tế của bạn.*

### 4. Thiết lập Cơ sở dữ liệu và Dữ liệu mẫu
Dự án sử dụng Prisma để quản lý database. Chạy các lệnh sau để khởi tạo:
```bash
# 1. Tạo các bảng trong database dựa trên schema
npx prisma db push

# 2. Khởi tạo dữ liệu mẫu (Roles, Permissions, Users, Trackers, v.v.)
npx prisma db seed
```

**Tài khoản quản trị mặc định sau khi seed:**
- **Email:** `admin@worksphere.com`
- **Mật khẩu:** `admin123`

### 5. Chạy dự án ở môi trường phát triển
```bash
npm run dev
```
Sau khi chạy thành công, truy cập: [http://localhost:3000](http://localhost:3000)

## 📁 Cấu trúc thư mục chính

- `src/app`: Các route và layout của ứng dụng (Next.js App Router).
- `src/components`: Các thành phần giao diện dùng chung (Project Cards, Task Detail, Layout, v.v.).
- `src/lib`: Các cấu hình dùng chung (Prisma Client, Auth, tiện ích xử lý dữ liệu).
- `prisma`: Schema database và các file seed dữ liệu.
- `public`: Các tài nguyên tĩnh (hình ảnh, biểu tượng).

## 📝 Script khả dụng

- `npm run dev`: Chạy server chế độ phát triển.
- `npm run build`: Xây dựng ứng dụng cho môi trường production.
- `npm run start`: Chạy ứng dụng đã build.
- `npm run lint`: Kiểm tra lỗi code với ESLint.

---
Phát triển bởi đội ngũ Worksphere.
