import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createTrackerSchema } from '@/lib/validations';

// GET /api/trackers - Lấy danh sách trackers
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

// POST /api/trackers - Tạo tracker mới
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

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
    } catch (error) {
        return handleApiError(error);
    }
}
