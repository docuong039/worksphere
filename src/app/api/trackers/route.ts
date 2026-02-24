import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-error';
import { createTrackerSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';

// GET /api/trackers - Lấy danh sách trackers (public)
export async function GET() {
    try {
        const trackers = await prisma.tracker.findMany({
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        return successResponse(trackers);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/trackers - Tạo tracker mới (admin only)
export const POST = withAdmin(async (req) => {
    const body = await req.json();
    const validatedData = createTrackerSchema.parse(body);

    // Lấy position cao nhất
    const maxPosition = await prisma.tracker.aggregate({
        _max: { position: true },
    });
    const newPosition = (maxPosition._max.position ?? 0) + 1;

    // Nếu set isDefault, bỏ default của các tracker khác
    if (validatedData.isDefault) {
        await prisma.tracker.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        });
    }

    const tracker = await prisma.tracker.create({
        data: {
            ...validatedData,
            position: validatedData.position ?? newPosition,
        },
    });

    return successResponse(tracker, 201);
});
