import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-error';
import { hasPermission } from '@/lib/permissions';

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

        const timeLog = await prisma.timeLog.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        if (!timeLog) {
            return errorResponse('Không tìm thấy bản ghi thời gian', 404);
        }

        // Check permission
        const isOwner = timeLog.userId === session.user.id;
        const canViewAll = await hasPermission(session.user, 'timelogs.view_all', timeLog.projectId);

        if (!session.user.isAdministrator && !isOwner && !canViewAll) {
            return errorResponse('Không có quyền xem bản ghi này', 403);
        }

        return successResponse(timeLog);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(
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
        const { hours, spentOn, activityId, comments } = body;

        const existingLog = await prisma.timeLog.findUnique({
            where: { id },
            select: { userId: true, projectId: true },
        });

        if (!existingLog) {
            return errorResponse('Không tìm thấy bản ghi thời gian', 404);
        }

        const isOwner = existingLog.userId === session.user.id;

        // Check edit permissions based on ownership
        if (!session.user.isAdministrator) {
            if (isOwner) {
                const canEditOwn = await hasPermission(session.user, 'timelogs.edit_own', existingLog.projectId);
                if (!canEditOwn) {
                    return errorResponse('Bạn không có quyền chỉnh sửa bản ghi thời gian', 403);
                }
            } else {
                const canEditAll = await hasPermission(session.user, 'timelogs.edit_all', existingLog.projectId);
                if (!canEditAll) {
                    return errorResponse('Bạn không có quyền chỉnh sửa bản ghi của người khác', 403);
                }
            }
        }

        const updateData: any = {};
        if (hours !== undefined) updateData.hours = parseFloat(hours);
        if (spentOn) updateData.spentOn = new Date(spentOn);
        if (activityId) updateData.activityId = activityId;
        if (comments !== undefined) updateData.comments = comments || null;

        const timeLog = await prisma.timeLog.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, name: true } },
                task: { select: { id: true, number: true, title: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        return successResponse(timeLog);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const existingLog = await prisma.timeLog.findUnique({
            where: { id },
            select: { userId: true, projectId: true },
        });

        if (!existingLog) {
            return errorResponse('Không tìm thấy bản ghi thời gian', 404);
        }

        const isOwner = existingLog.userId === session.user.id;

        // Check delete permissions based on ownership
        if (!session.user.isAdministrator) {
            if (isOwner) {
                const canDeleteOwn = await hasPermission(session.user, 'timelogs.delete_own', existingLog.projectId);
                if (!canDeleteOwn) {
                    return errorResponse('Bạn không có quyền xóa bản ghi thời gian', 403);
                }
            } else {
                const canDeleteAll = await hasPermission(session.user, 'timelogs.delete_all', existingLog.projectId);
                if (!canDeleteAll) {
                    return errorResponse('Bạn không có quyền xóa bản ghi của người khác', 403);
                }
            }
        }

        await prisma.timeLog.delete({ where: { id } });

        return successResponse({ message: 'Đã xóa bản ghi thời gian' });
    } catch (error) {
        return handleApiError(error);
    }
}
