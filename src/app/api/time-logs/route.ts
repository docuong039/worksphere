import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/time-logs - Get raw time logs list
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const isAdmin = session.user.isAdministrator;

        // Where clause
        const where: any = {};

        // Date filter
        if (startDate || endDate) {
            where.spentOn = {};
            if (startDate) where.spentOn.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.spentOn.lte = end;
            }
        }

        // Project filter
        if (projectId) {
            where.projectId = projectId;
        } else if (!isAdmin) {
            where.project = { members: { some: { userId: session.user.id } } };
        }

        // User filter
        if (userId) {
            where.userId = userId;
        }

        const timeLogs = await prisma.timeLog.findMany({
            where,
            include: {
                project: { select: { name: true } },
                task: { select: { title: true, number: true } },
                user: { select: { name: true, email: true } },
                activity: { select: { name: true } },
            },
            orderBy: { spentOn: 'desc' },
            take: 1000, // Limit for safety
        });

        return successResponse({ timeLogs });
    } catch (error) {
        return handleApiError(error);
    }
}
