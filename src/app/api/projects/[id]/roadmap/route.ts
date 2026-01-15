import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/projects/[id]/roadmap - Get roadmap view (tasks grouped by version)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Không được quyền truy cập' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const includeCompleted = searchParams.get('includeCompleted') === 'true';
        const trackerId = searchParams.get('trackerId');

        // Check project access
        const canAccess = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: { projectId: id, userId: session.user.id },
            });

        if (!canAccess) {
            return NextResponse.json({ error: 'Hành động bị cấm' }, { status: 403 });
        }

        // Get versions with their tasks
        const versions = await prisma.version.findMany({
            where: {
                projectId: id,
                ...(includeCompleted ? {} : { status: { not: 'closed' } }),
            },
            include: {
                tasks: {
                    where: {
                        ...(trackerId ? { trackerId } : {}),
                    },
                    include: {
                        status: { select: { id: true, name: true, isClosed: true } },
                        priority: { select: { id: true, name: true, color: true } },
                        tracker: { select: { id: true, name: true } },
                        assignee: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: [
                        { priority: { position: 'asc' } },
                        { createdAt: 'asc' },
                    ],
                },
            },
            orderBy: [
                { status: 'asc' },
                { dueDate: 'asc' },
            ],
        });

        // Calculate progress for each version
        const roadmap = versions.map(version => {
            const totalTasks = version.tasks.length;
            const closedTasks = version.tasks.filter(t => t.status.isClosed).length;
            const openTasks = totalTasks - closedTasks;

            // Calculate completion percentage
            const avgDoneRatio = totalTasks > 0
                ? Math.round(version.tasks.reduce((sum, t) => sum + t.doneRatio, 0) / totalTasks)
                : 0;

            // Group tasks by status
            const tasksByStatus = version.tasks.reduce((acc, task) => {
                const statusName = task.status.name;
                if (!acc[statusName]) {
                    acc[statusName] = [];
                }
                acc[statusName].push(task);
                return acc;
            }, {} as Record<string, typeof version.tasks>);

            return {
                ...version,
                progress: {
                    total: totalTasks,
                    closed: closedTasks,
                    open: openTasks,
                    doneRatio: avgDoneRatio,
                    percentage: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
                },
                tasksByStatus,
            };
        });

        // Get tasks without version (backlog)
        const backlogTasks = await prisma.task.findMany({
            where: {
                projectId: id,
                versionId: null,
                ...(trackerId ? { trackerId } : {}),
            },
            include: {
                status: { select: { id: true, name: true, isClosed: true } },
                priority: { select: { id: true, name: true, color: true } },
                tracker: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: [
                { priority: { position: 'asc' } },
                { createdAt: 'asc' },
            ],
            take: 50,
        });

        return NextResponse.json({
            versions: roadmap,
            backlog: {
                tasks: backlogTasks,
                count: backlogTasks.length,
            },
        });
    } catch (error) {
        console.error('Error fetching roadmap:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}
