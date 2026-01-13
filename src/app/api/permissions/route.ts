import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-error';

// GET /api/permissions - Lấy tất cả permissions (grouped by module)
export async function GET() {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }],
        });

        // Group by module
        const grouped = permissions.reduce(
            (acc, perm) => {
                if (!acc[perm.module]) {
                    acc[perm.module] = [];
                }
                acc[perm.module].push(perm);
                return acc;
            },
            {} as Record<string, typeof permissions>
        );

        return successResponse({
            permissions,
            grouped,
            modules: Object.keys(grouped),
        });
    } catch (error) {
        return handleApiError(error);
    }
}
