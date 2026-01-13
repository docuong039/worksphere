import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createRoleSchema } from '@/lib/validations';

// GET /api/roles - Lấy danh sách roles
export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { projectMembers: true },
                },
            },
        });

        return successResponse(roles);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/roles - Tạo role mới
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const body = await req.json();
        const validatedData = createRoleSchema.parse(body);

        const role = await prisma.role.create({
            data: validatedData,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return successResponse(role, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
