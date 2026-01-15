import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/queries - List saved queries
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        // Get queries user has access to:
        // 1. Their own queries
        // 2. Public queries
        // 3. If admin, all queries
        const queries = await prisma.query.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { isPublic: true },
                    ...(session.user.isAdministrator ? [{}] : []),
                ],
                ...(projectId ? { projectId } : {}),
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
            orderBy: [{ isPublic: 'desc' }, { name: 'asc' }],
        });

        return NextResponse.json(queries);
    } catch (error) {
        console.error('Error fetching queries:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

// POST /api/queries - Create a new saved query
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            projectId,
            isPublic,
            filters,
            columns,
            sortBy,
            sortOrder,
            groupBy,
        } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Vui lòng nhập tên bộ lọc' }, { status: 400 });
        }

        if (!filters || typeof filters !== 'object') {
            return NextResponse.json({ error: 'Tiêu chí lọc là bắt buộc' }, { status: 400 });
        }

        // Only admins or users with manage_public_queries permission can create public queries
        if (isPublic && !session.user.isAdministrator) {
            const hasPermission = await prisma.projectMember.findFirst({
                where: {
                    userId: session.user.id,
                    ...(projectId ? { projectId } : {}),
                    role: {
                        permissions: {
                            some: { permission: { key: 'queries.manage_public' } },
                        },
                    },
                },
            });
            if (!hasPermission) {
                return NextResponse.json({ error: 'Không có quyền tạo bộ lọc công khai' }, { status: 403 });
            }
        }

        const query = await prisma.query.create({
            data: {
                name: name.trim(),
                projectId: projectId || null,
                userId: session.user.id,
                isPublic: isPublic || false,
                filters: JSON.stringify(filters),
                columns: columns ? JSON.stringify(columns) : null,
                sortBy: sortBy || null,
                sortOrder: sortOrder || 'asc',
                groupBy: groupBy || null,
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(query, { status: 201 });
    } catch (error) {
        console.error('Error creating query:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}
