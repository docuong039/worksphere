import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-error';
import { handleApiError } from '@/lib/api-error';
import { createRoleSchema } from '@/lib/validations';
import { withAdmin } from '@/server/middleware/withAuth';

// GET /api/roles - Lấy danh sách roles (public, không cần auth)
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

// POST /api/roles - Tạo role mới (admin only)
export const POST = withAdmin(async (req) => {
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
});
