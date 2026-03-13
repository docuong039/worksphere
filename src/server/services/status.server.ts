import prisma from '@/lib/prisma';
import { createStatusSchema, updateStatusSchema } from '@/lib/validations';
import { z } from 'zod';

export class StatusServerService {
    static async getStatuses() {
        return prisma.status.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }

    static async getStatusById(id: string) {
        const status = await prisma.status.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!status) {
            throw new Error('Status không tồn tại-404');
        }

        return status;
    }

    static async createStatus(validatedData: z.infer<typeof createStatusSchema>) {
        const maxPosition = await prisma.status.aggregate({
            _max: { position: true },
        });
        const newPosition = (maxPosition._max.position ?? 0) + 1;

        if (validatedData.isDefault) {
            await prisma.status.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        return prisma.status.create({
            data: {
                ...validatedData,
                position: validatedData.position ?? newPosition,
            },
        });
    }

    static async updateStatus(id: string, validatedData: z.infer<typeof updateStatusSchema>) {
        if (validatedData.isDefault) {
            await prisma.status.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        return prisma.status.update({
            where: { id },
            data: validatedData,
        });
    }

    static async deleteStatus(id: string) {
        const taskCount = await prisma.task.count({
            where: { statusId: id },
        });

        if (taskCount > 0) {
            throw new Error(`Không thể xóa status đang được sử dụng bởi ${taskCount} công việc-400`);
        }

        const transitionCount = await prisma.workflowTransition.count({
            where: {
                OR: [{ fromStatusId: id }, { toStatusId: id }],
            },
        });

        if (transitionCount > 0) {
            throw new Error('Không thể xóa status đang được sử dụng trong workflow-400');
        }

        await prisma.status.delete({
            where: { id },
        });

        return { message: 'Đã xóa status' };
    }
}
