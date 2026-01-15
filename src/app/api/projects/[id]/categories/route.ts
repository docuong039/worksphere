import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/projects/[id]/categories - Get categories for a project
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không được quyền truy cập' }, { status: 401 });
        }

        const { id } = await params;

        // Check project access
        const canAccess = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: { projectId: id, userId: session.user.id },
            });

        if (!canAccess) {
            return NextResponse.json({ error: 'Hành động bị cấm' }, { status: 403 });
        }

        const categories = await prisma.issueCategory.findMany({
            where: { projectId: id },
            include: {
                assignedTo: {
                    select: { id: true, name: true, avatar: true },
                },
                _count: { select: { tasks: true } },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

// POST /api/projects/[id]/categories - Create a new category
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không được quyền truy cập' }, { status: 401 });
        }

        const { id } = await params;

        // Check permission
        const hasPermission = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: id,
                    userId: session.user.id,
                    role: {
                        permissions: {
                            some: { permission: { key: 'projects.manage_categories' } },
                        },
                    },
                },
            });

        if (!hasPermission) {
            return NextResponse.json({ error: 'Hành động bị cấm' }, { status: 403 });
        }

        const body = await request.json();
        const { name, assignedToId } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Vui lòng nhập tên' }, { status: 400 });
        }

        // Check duplicate
        const existing = await prisma.issueCategory.findFirst({
            where: { projectId: id, name: name.trim() },
        });
        if (existing) {
            return NextResponse.json({ error: 'Danh mục với tên này đã tồn tại' }, { status: 400 });
        }

        const category = await prisma.issueCategory.create({
            data: {
                name: name.trim(),
                projectId: id,
                assignedToId: assignedToId || null,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}
