import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { checkProjectPermission } from '@/lib/permissions';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;

        // 1. Check Permission: 'projects.manage' (or similar manager role)
        // For simplicity, we check if user is admin or has 'Manage' role in project
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: id, userId: session.user.id } },
            include: { role: true },
        });

        const canManage = session.user.isAdministrator || (member?.role.name === 'Manager' || member?.role.name === 'Quản lý');

        if (!canManage) {
            return errorResponse('Bạn không có quyền quản lý thiết lập dự án này', 403);
        }

        const body = await req.json();
        const {
            parentIssueDates,
            parentIssuePriority,
            parentIssueDoneRatio,
            parentIssueEstimatedHours
        } = body;

        // Validation (simple enum check)
        const modes = ['calculated', 'independent'];
        if (
            (parentIssueDates && !modes.includes(parentIssueDates)) ||
            (parentIssuePriority && !modes.includes(parentIssuePriority)) ||
            (parentIssueDoneRatio && !modes.includes(parentIssueDoneRatio)) ||
            (parentIssueEstimatedHours && !modes.includes(parentIssueEstimatedHours))
        ) {
            return errorResponse('Giá trị cấu hình không hợp lệ', 400);
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                parentIssueDates,
                parentIssuePriority,
                parentIssueDoneRatio,
                parentIssueEstimatedHours,
            },
        });

        return successResponse(updatedProject);
    } catch (error) {
        return handleApiError(error);
    }
}
