import prisma from '@/lib/prisma';
import { createTrackerSchema, updateTrackerSchema } from '@/lib/validations';
import { z } from 'zod';

export class TrackerServerService {
    static async getTrackers() {
        return prisma.tracker.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }

    static async getTrackerById(id: string) {
        const tracker = await prisma.tracker.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!tracker) {
            throw new Error('Tracker không tồn tại-404');
        }

        return tracker;
    }

    static async createTracker(validatedData: z.infer<typeof createTrackerSchema>) {
        const maxPosition = await prisma.tracker.aggregate({
            _max: { position: true },
        });
        const newPosition = (maxPosition._max.position ?? 0) + 1;

        if (validatedData.isDefault) {
            await prisma.tracker.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        return prisma.tracker.create({
            data: {
                ...validatedData,
                position: validatedData.position ?? newPosition,
            },
        });
    }

    static async updateTracker(id: string, validatedData: z.infer<typeof updateTrackerSchema>) {
        if (validatedData.isDefault) {
            await prisma.tracker.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        return prisma.tracker.update({
            where: { id },
            data: validatedData,
        });
    }

    static async deleteTracker(id: string) {
        const taskCount = await prisma.task.count({
            where: { trackerId: id },
        });

        if (taskCount > 0) {
            throw new Error(`Không thể xóa tracker đang được sử dụng bởi ${taskCount} công việc-400`);
        }

        await prisma.tracker.delete({
            where: { id },
        });

        return { message: 'Đã xóa tracker' };
    }
}
