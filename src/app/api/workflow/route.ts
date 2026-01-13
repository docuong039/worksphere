import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';

// GET /api/workflow - Lấy workflow matrix
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const trackerId = searchParams.get('trackerId');
        const roleId = searchParams.get('roleId');

        // Lấy tất cả trackers, statuses, roles
        const [trackers, statuses, roles] = await Promise.all([
            prisma.tracker.findMany({ orderBy: { position: 'asc' } }),
            prisma.status.findMany({ orderBy: { position: 'asc' } }),
            prisma.role.findMany({ orderBy: { name: 'asc' } }),
        ]);

        // Lấy transitions (filter nếu có params)
        const transitions = await prisma.workflowTransition.findMany({
            where: {
                ...(trackerId ? { trackerId } : {}),
                ...(roleId !== undefined ? { roleId: roleId || null } : {}),
            },
            select: {
                id: true,
                trackerId: true,
                roleId: true,
                fromStatusId: true,
                toStatusId: true,
            },
        });

        return successResponse({
            trackers,
            statuses,
            roles,
            transitions,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/workflow - Cập nhật workflow transitions
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.isAdministrator) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const body = await req.json();
        const { trackerId, roleId, transitions } = body;

        if (!trackerId) {
            return errorResponse('Tracker ID là bắt buộc', 400);
        }

        if (!Array.isArray(transitions)) {
            return errorResponse('Transitions phải là một mảng', 400);
        }

        // Xóa tất cả transitions cũ cho tracker + role này
        await prisma.workflowTransition.deleteMany({
            where: {
                trackerId,
                roleId: roleId || null,
            },
        });

        // Tạo transitions mới
        const newTransitions = transitions
            .filter((t: { allowed: boolean }) => t.allowed)
            .map((t: { fromStatusId: string; toStatusId: string }) => ({
                trackerId,
                roleId: roleId || null,
                fromStatusId: t.fromStatusId,
                toStatusId: t.toStatusId,
            }));

        if (newTransitions.length > 0) {
            await prisma.workflowTransition.createMany({
                data: newTransitions,
            });
        }

        return successResponse({
            message: 'Đã cập nhật workflow',
            count: newTransitions.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
