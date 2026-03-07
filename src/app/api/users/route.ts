import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-error';
import { createUserSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { withAdmin, withAuth } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import { ReportPolicy } from '@/modules/report/report.policy';

// GET /api/users - Lấy danh sách users (có filter theo quyền)
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const excludeAdmins = searchParams.get('excludeAdmins') === 'true';

    const globalPerms = await getUserPermissions(user.id);
    const scope = ReportPolicy.getPersonnelVisibilityScope(user, globalPerms);

    const where: any = search
        ? {
            OR: [
                { name: { contains: search } },
                { email: { contains: search } },
            ],
        }
        : {};

    if (excludeAdmins) {
        where.isAdministrator = false;
    }

    if (!user.isAdministrator) {
        if (scope === 'SELF') {
            where.id = user.id;
        } else if (scope === 'PROJECT_MEMBERS') {
            where.projectMemberships = {
                some: {
                    project: {
                        members: {
                            some: { userId: user.id }
                        }
                    }
                }
            };
        }
    }

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
