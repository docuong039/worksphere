/**
 * @file src/types/next-auth.d.ts
 * @description
 * MỞ RỘNG THƯ VIỆN NEXT-AUTH.
 * Thêm thuộc tính `isAdministrator` vào kiểu dữ liệu `Session` và `User` mặc định của NextAuth,
 * giúp trình biên dịch không báo lỗi khi truy cập `session.user.isAdministrator`.
 */
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            isAdministrator: boolean;
        } & DefaultSession['user'];
    }

    interface User {
        isAdministrator: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        isAdministrator: boolean;
    }
}
