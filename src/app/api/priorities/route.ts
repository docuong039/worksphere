import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createPrioritySchema } from '@/lib/validations';

// GET /api/priorities - Lấy danh sách priorities
export async function GET() {
    try {
        const priorities = await prisma.priority.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        return successResponse(priorities);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/priorities - Tạo priority mới
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const body = await req.json();
        const validatedData = createPrioritySchema.parse(body);

        // Lấy position cao nhất
        const maxPosition = await prisma.priority.aggregate({
            _max: { position: true },
        });
        const newPosition = (maxPosition._max.position ?? 0) + 1;

        // Nếu set isDefault, bỏ default của các priority khác
        if (validatedData.isDefault) {
            await prisma.priority.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        const priority = await prisma.priority.create({
            data: {
                ...validatedData,
                position: validatedData.position ?? newPosition,
            },
        });

        return successResponse(priority, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
