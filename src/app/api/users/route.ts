import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createUserSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

// GET /api/users - Lấy danh sách users
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

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
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/users - Tạo user mới
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

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
    } catch (error) {
        return handleApiError(error);
    }
}
