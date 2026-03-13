import prisma from '@/lib/prisma';
import { createActivitySchema, updateActivitySchema } from '@/lib/validations';
import { z } from 'zod';

export class TimeEntryActivityServerService {
    static async getActivities(includeInactive: boolean = false) {
        const where: any = {};
        if (!includeInactive) {
            where.isActive = true;
        }

        return prisma.timeEntryActivity.findMany({
            where,
            orderBy: { position: 'asc' },
        });
    }

    static async getActivityById(id: string) {
        const activity = await prisma.timeEntryActivity.findUnique({
            where: { id },
        });

        if (!activity) {
            throw new Error('Hoạt động không tồn tại-404');
        }

        return activity;
    }

    static async createActivity(validatedData: z.infer<typeof createActivitySchema>) {
        const existing = await prisma.timeEntryActivity.findFirst({
            where: { name: validatedData.name },
        });

        if (existing) {
            throw new Error('Tên hoạt động đã tồn tại-400');
        }

        return prisma.timeEntryActivity.create({
            data: {
                name: validatedData.name,
                position: validatedData.position ?? 0,
                isDefault: validatedData.isDefault ?? false,
                isActive: validatedData.isActive ?? true,
            },
        });
    }

    static async updateActivity(id: string, validatedData: z.infer<typeof updateActivitySchema>) {
        if (validatedData.name) {
            const existing = await prisma.timeEntryActivity.findFirst({
                where: {
                    name: validatedData.name,
                    id: { not: id },
                },
            });

            if (existing) {
                throw new Error('Tên hoạt động đã tồn tại-400');
            }
        }

        return prisma.timeEntryActivity.update({
            where: { id },
            data: validatedData,
        });
    }

    static async deleteActivity(id: string) {
        const timeLogCount = await prisma.timeLog.count({
            where: { activityId: id },
        });

        if (timeLogCount > 0) {
            throw new Error(`Không thể xóa hoạt động đang được sử dụng bởi ${timeLogCount} dữ liệu chấm công-400`);
        }

        await prisma.timeEntryActivity.delete({
            where: { id },
        });

        return { message: 'Đã xóa hoạt động' };
    }
}
