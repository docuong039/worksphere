import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/categories/[id] - Get a single category
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

        const category = await prisma.issueCategory.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true, avatar: true } },
                _count: { select: { tasks: true } },
            },
        });

        if (!category) {
            return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không được quyền truy cập' }, { status: 401 });
        }

        const { id } = await params;

        const category = await prisma.issueCategory.findUnique({
            where: { id },
            select: { projectId: true },
        });

        if (!category) {
            return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 });
        }

        // Check permission
        const hasPermission = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: category.projectId,
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

        if (name !== undefined && !name?.trim()) {
            return NextResponse.json({ error: 'Tên không được để trống' }, { status: 400 });
        }

        // Check duplicate name
        if (name) {
            const existing = await prisma.issueCategory.findFirst({
                where: {
                    projectId: category.projectId,
                    name: name.trim(),
                    NOT: { id },
                },
            });
            if (existing) {
                return NextResponse.json({ error: 'Danh mục với tên này đã tồn tại' }, { status: 400 });
            }
        }

        const updated = await prisma.issueCategory.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
            },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không được quyền truy cập' }, { status: 401 });
        }

        const { id } = await params;

        const category = await prisma.issueCategory.findUnique({
            where: { id },
            include: { _count: { select: { tasks: true } } },
        });

        if (!category) {
            return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 });
        }

        // Check permission
        const hasPermission = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: category.projectId,
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

        // Delete category (tasks will have categoryId set to null due to onDelete: SetNull)
        await prisma.issueCategory.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}
