import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { createTimeLogSchema } from '@/lib/validations';
import { canViewTask, hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Helper: Resolve Task ID (CUID or Number)
async function resolveTaskId(idStr: string) {
    if (/^\d+$/.test(idStr)) {
        const task = await prisma.task.findUnique({
            where: { number: parseInt(idStr) },
            select: { id: true }
        });

        return task?.id || null;
    }
    return idStr;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: rawId } = await params;
        const id = await resolveTaskId(rawId);

        if (!id) {
            return errorResponse('Không tìm thấy công việc', 404);
        }

        // Check if user can view task
        const canView = await canViewTask(session.user, id);
        if (!canView) {
            return errorResponse('Không có quyền xem công việc này', 403);
        }

        // Check view permissions for time logs
        const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
        const canViewAll = await hasPermission(session.user, 'timelogs.view_all', task?.projectId);
        const canViewOwn = await hasPermission(session.user, 'timelogs.view_own', task?.projectId);

        if (!canViewAll && !canViewOwn) {
            return errorResponse('Không có quyền xem nhật ký thời gian', 403);
        }

        const timeLogs = await prisma.timeLog.findMany({
            where: {
                taskId: id,
                ...(canViewAll ? {} : { userId: session.user.id }) // If only canViewOwn, filter by current user
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
            },
            orderBy: { spentOn: 'desc' },
        });

        return successResponse(timeLogs);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: rawId } = await params;
        const id = await resolveTaskId(rawId);

        if (!id) {
            return errorResponse('Không tìm thấy công việc', 404);
        }

        const body = await req.json();
        const validatedData = createTimeLogSchema.parse(body);

        const task = await prisma.task.findUnique({
            where: { id },
            select: { projectId: true },
        });

        if (!task) {
            return errorResponse('Không tìm thấy công việc', 404);
        }

        // Check project membership (minimal requirement)
        const isMember = await prisma.projectMember.findFirst({
            where: { userId: session.user.id, projectId: task.projectId }
        });

        if (!session.user.isAdministrator && !isMember) {
            return errorResponse('Bạn không phải là thành viên của dự án này', 403);
        }

        // Check permission to log time
        const canLogTime = await hasPermission(session.user, 'timelogs.log_time', task.projectId);
        if (!session.user.isAdministrator && !canLogTime) {
            return errorResponse('Bạn không có quyền ghi nhận thời gian', 403);
        }

        const timeLog = await prisma.timeLog.create({
            data: {
                hours: validatedData.hours,
                spentOn: new Date(validatedData.spentOn),
                comments: validatedData.comments,
                activityId: validatedData.activityId,
                taskId: id,
                projectId: task.projectId,
                userId: session.user.id,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
            },
        });

        return successResponse(timeLog);
    } catch (error) {
        return handleApiError(error);
    }
}
