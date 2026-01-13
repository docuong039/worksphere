import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/archive - Archive/Unarchive project
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Kiểm tra quyền (chỉ admin hoặc creator)
        const project = await prisma.project.findUnique({
            where: { id },
            select: { creatorId: true, isArchived: true },
        });

        if (!project) {
            return errorResponse('Dự án không tồn tại', 404);
        }

        const canManage =
            session.user.isAdministrator || project.creatorId === session.user.id;

        if (!canManage) {
            return errorResponse('Không có quyền thực hiện thao tác này', 403);
        }

        // Toggle archive status
        const updatedProject = await prisma.project.update({
            where: { id },
            data: { isArchived: !project.isArchived },
            select: {
                id: true,
                name: true,
                isArchived: true,
            },
        });

        return successResponse({
            message: updatedProject.isArchived ? 'Đã lưu trữ dự án' : 'Đã khôi phục dự án',
            project: updatedProject,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
