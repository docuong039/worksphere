import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-error';
import { createPrioritySchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';

// GET /api/priorities - Lấy danh sách priorities (public)
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

// POST /api/priorities - Tạo priority mới (admin only)
export const POST = withAdmin(async (req) => {
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
});
