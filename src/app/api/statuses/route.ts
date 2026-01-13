import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createStatusSchema } from '@/lib/validations';

// GET /api/statuses - Lấy danh sách statuses
export async function GET() {
    try {
        const statuses = await prisma.status.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        return successResponse(statuses);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/statuses - Tạo status mới
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const body = await req.json();
        const validatedData = createStatusSchema.parse(body);

        // Lấy position cao nhất
        const maxPosition = await prisma.status.aggregate({
            _max: { position: true },
        });
        const newPosition = (maxPosition._max.position ?? 0) + 1;

        // Nếu set isDefault, bỏ default của các status khác
        if (validatedData.isDefault) {
            await prisma.status.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        const status = await prisma.status.create({
            data: {
                ...validatedData,
                position: validatedData.position ?? newPosition,
            },
        });

        return successResponse(status, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
