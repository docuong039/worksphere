import prisma from '@/lib/prisma';
import { createPrioritySchema, updatePrioritySchema } from '@/lib/validations';
import { z } from 'zod';

export class PriorityServerService {
    static async getPriorities() {
        return prisma.priority.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }

    static async getPriorityById(id: string) {
        const priority = await prisma.priority.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!priority) {
            throw new Error('Priority không tồn tại-404');
        }

        return priority;
    }

    static async createPriority(validatedData: z.infer<typeof createPrioritySchema>) {
        const maxPosition = await prisma.priority.aggregate({
            _max: { position: true },
        });
        const newPosition = (maxPosition._max.position ?? 0) + 1;

        if (validatedData.isDefault) {
            await prisma.priority.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        return prisma.priority.create({
            data: {
                ...validatedData,
                position: validatedData.position ?? newPosition,
            },
        });
    }

    static async updatePriority(id: string, validatedData: z.infer<typeof updatePrioritySchema>) {
        if (validatedData.isDefault) {
            await prisma.priority.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        return prisma.priority.update({
            where: { id },
            data: validatedData,
        });
    }

    static async deletePriority(id: string) {
        const taskCount = await prisma.task.count({
            where: { priorityId: id },
        });

        if (taskCount > 0) {
            throw new Error(`Không thể xóa priority đang được sử dụng bởi ${taskCount} công việc-400`);
        }

        await prisma.priority.delete({
            where: { id },
        });

        return { message: 'Đã xóa priority' };
    }
}
