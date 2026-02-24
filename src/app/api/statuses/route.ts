import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-error';
import { createStatusSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';

// GET /api/statuses - Lấy danh sách statuses (public)
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

// POST /api/statuses - Tạo status mới (admin only)
export const POST = withAdmin(async (req) => {
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
});
