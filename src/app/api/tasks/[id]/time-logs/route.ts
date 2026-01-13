import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createTimeLogSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/tasks/[id]/time-logs - Lấy danh sách time logs của task
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const timeLogs = await prisma.timeLog.findMany({
            where: { taskId: params.id },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { date: 'desc' },
        });

        return successResponse(timeLogs);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/tasks/[id]/time-logs - Tạo time log mới
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const json = await request.json();
        const body = createTimeLogSchema.parse(json);

        // Kiểm tra task tồn tại
        const task = await prisma.task.findUnique({
            where: { id: params.id },
            select: { id: true, projectId: true, title: true, number: true },
        });

        if (!task) {
            return errorResponse('Task không tồn tại', 404);
        }

        // Tạo time log
        const timeLog = await (prisma.timeLog as any).create({
            data: {
                hours: body.hours,
                activity: body.activity,
                date: new Date(body.date),
                description: body.description,
                taskId: params.id,
                userId: session.user.id,
            },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        // Ghi log hoạt động
        await prisma.auditLog.create({
            data: {
                action: 'LOGGED_TIME',
                entityType: 'task',
                entityId: params.id,
                userId: session.user.id,
                changes: {
                    hours: body.hours,
                    activity: body.activity,
                    date: body.date,
                },
            },
        });

        return successResponse(timeLog, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
