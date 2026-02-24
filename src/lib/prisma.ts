/**
 * @file prisma.ts
 * @description Quản lý kết nối tới Cơ sở dữ liệu thông qua Prisma Client.
 * Sử dụng Singleton Pattern để đảm bảo chỉ có một instance duy nhất được tạo ra, tránh quá tải kết nối.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
