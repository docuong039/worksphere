import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

interface Params {
    params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        const relation = await prisma.issueRelation.findUnique({
            where: { id },
            include: {
                issueFrom: { select: { projectId: true } },
            },
        });

        if (!relation) {
            return errorResponse('Liên kết không tồn tại', 404);
        }

        const canDelete =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: {
                    userId: session.user.id,
                    projectId: relation.issueFrom.projectId,
                    role: {
                        permissions: {
                            some: {
                                permission: { key: { in: ['tasks.edit_any', 'tasks.manage_relations'] } },
                            },
                        },
                    },
                },
            }));

        if (!canDelete) {
            return errorResponse('Không có quyền xóa liên kết', 403);
        }

        await prisma.issueRelation.delete({
            where: { id },
        });

        return successResponse({ message: 'Đã xóa liên kết' });
    } catch (error) {
        return handleApiError(error);
    }
}
