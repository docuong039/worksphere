import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { createTimeLogSchema } from '@/lib/validations';
import { isProjectMember, hasPermission } from '@/lib/permissions';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Check if user is project member
        const isMember = await isProjectMember(session.user.id, id);
        if (!isMember) {
            return errorResponse('Không có quyền xem dự án này', 403);
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const activityId = searchParams.get('activityId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        const where: any = { projectId: id };
        if (userId) where.userId = userId;
        if (activityId) where.activityId = activityId;
        if (fromDate || toDate) {
            where.spentOn = {};
            if (fromDate) where.spentOn.gte = new Date(fromDate);
            if (toDate) where.spentOn.lte = new Date(toDate);
        }

        const timeLogs = await prisma.timeLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
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

        const { id } = await params;
        const body = await req.json();
        const validatedData = createTimeLogSchema.parse(body);

        // Check if user is project member
        const isMember = await isProjectMember(session.user.id, id);
        if (!isMember) {
            return errorResponse('Không có quyền ghi thời gian cho dự án này', 403);
        }

        // Check permission to log time
        const canLogTime = await hasPermission(session.user, 'timelogs.log_time', id);
        if (!session.user.isAdministrator && !canLogTime) {
            return errorResponse('Bạn không có quyền ghi nhận thời gian', 403);
        }

        const timeLog = await prisma.timeLog.create({
            data: {
                hours: validatedData.hours,
                spentOn: new Date(validatedData.spentOn),
                comments: validatedData.comments,
                activityId: validatedData.activityId,
                taskId: validatedData.taskId || null,
                projectId: id,
                userId: session.user.id,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
            },
        });

        return successResponse(timeLog);
    } catch (error) {
        return handleApiError(error);
    }
}
