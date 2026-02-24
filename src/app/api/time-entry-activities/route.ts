import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-error';
import { createActivitySchema } from '@/lib/validations';
import { withAuth, withAdmin } from '@/server/middleware/withAuth';

export const GET = withAuth(async (req) => {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};
    if (!includeInactive) {
        where.isActive = true;
    }

    const activities = await prisma.timeEntryActivity.findMany({
        where,
        orderBy: { position: 'asc' },
    });

    return successResponse(activities);
});

export const POST = withAdmin(async (req) => {
    const body = await req.json();
    const validatedData = createActivitySchema.parse(body);

    // Check duplicate name
    const existing = await prisma.timeEntryActivity.findFirst({
        where: { name: validatedData.name },
    });

    if (existing) {
        const { errorResponse } = await import('@/lib/api-error');
        return errorResponse('Tên hoạt động đã tồn tại', 400);
    }

    const activity = await prisma.timeEntryActivity.create({
        data: {
            name: validatedData.name,
            position: validatedData.position ?? 0,
            isDefault: validatedData.isDefault ?? false,
            isActive: validatedData.isActive ?? true,
        },
    });

    return successResponse(activity);
});
