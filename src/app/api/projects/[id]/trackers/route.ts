import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/projects/[id]/trackers - Get trackers enabled for a project
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

        const projectTrackers = await prisma.projectTracker.findMany({
            where: { projectId: id },
            include: {
                tracker: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        position: true,
                        isDefault: true,
                    },
                },
            },
            orderBy: { tracker: { position: 'asc' } },
        });

        // If no trackers assigned, return all trackers (default behavior)
        if (projectTrackers.length === 0) {
            const allTrackers = await prisma.tracker.findMany({
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    position: true,
                    isDefault: true,
                },
            });
            return NextResponse.json(allTrackers);
        }

        return NextResponse.json(projectTrackers.map(pt => pt.tracker));
    } catch (error) {
        console.error('Error fetching project trackers:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

// PUT /api/projects/[id]/trackers - Update trackers for a project
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

        // Check permission
        const hasPermission = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: id,
                    userId: session.user.id,
                    role: {
                        permissions: {
                            some: { permission: { key: 'projects.manage_trackers' } },
                        },
                    },
                },
            });

        if (!hasPermission) {
            return NextResponse.json({ error: 'Hành động bị cấm' }, { status: 403 });
        }

        const { trackerIds } = await request.json();

        if (!Array.isArray(trackerIds)) {
            return NextResponse.json({ error: 'Danh sách ID tracker phải là một mảng' }, { status: 400 });
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
        }

        // Transaction: delete existing and create new
        await prisma.$transaction(async (tx) => {
            await tx.projectTracker.deleteMany({
                where: { projectId: id },
            });

            if (trackerIds.length > 0) {
                await tx.projectTracker.createMany({
                    data: trackerIds.map((trackerId: string) => ({
                        projectId: id,
                        trackerId,
                    })),
                    skipDuplicates: true,
                });
            }
        });

        const updated = await prisma.projectTracker.findMany({
            where: { projectId: id },
            include: { tracker: true },
        });

        return NextResponse.json(updated.map(pt => pt.tracker));
    } catch (error) {
        console.error('Error updating project trackers:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}
