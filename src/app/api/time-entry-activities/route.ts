import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { createActivitySchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

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
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        if (!session.user.isAdministrator) {
            return errorResponse('Chỉ quản trị viên mới có quyền tạo hoạt động', 403);
        }

        const body = await req.json();
        const validatedData = createActivitySchema.parse(body);

        // Check duplicate name
        const existing = await prisma.timeEntryActivity.findFirst({
            where: { name: validatedData.name },
        });

        if (existing) {
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
    } catch (error) {
        return handleApiError(error);
    }
}
