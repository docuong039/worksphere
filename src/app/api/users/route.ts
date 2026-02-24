import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-error';
import { createUserSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { withAdmin } from '@/server/middleware/withAuth';

// GET /api/users - Lấy danh sách users (admin only)
export const GET = withAdmin(async (req) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where = search
        ? {
            OR: [
                { name: { contains: search } },
                { email: { contains: search } },
            ],
        }
        : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isAdministrator: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        projectMemberships: true,
                        assignedTasks: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return successResponse({
        users,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    });
});

// POST /api/users - Tạo user mới (admin only)
export const POST = withAdmin(async (req) => {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
        data: {
            email: validatedData.email,
            name: validatedData.name,
            password: hashedPassword,
            isAdministrator: validatedData.isAdministrator || false,
        },
        select: {
            id: true,
            email: true,
            name: true,
            isAdministrator: true,
            isActive: true,
            createdAt: true,
        },
    });

    return successResponse(user, 201);
});
