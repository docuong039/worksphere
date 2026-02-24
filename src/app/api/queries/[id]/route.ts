import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as QueryPolicy from '@/modules/query/query.policy';
import { PERMISSIONS } from '@/lib/constants';


// GET /api/queries/[id]
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const query = await prisma.query.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true } },
            project: { select: { id: true, name: true, identifier: true } },
        },
    });

    if (!query) {
        return errorResponse('Không tìm thấy bộ lọc', 404);
    }

    // Authorization Policy check
    const canView = QueryPolicy.canViewQuery(user, query);

    if (!canView) {
        return errorResponse('Bạn không có quyền truy cập bộ lọc này', 403);
    }


    return successResponse({
        ...query,
        filters: JSON.parse(query.filters),
        columns: query.columns ? JSON.parse(query.columns) : null,
    });
});

// PUT /api/queries/[id]
export const PUT = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const query = await prisma.query.findUnique({ where: { id } });
    if (!query) {
        return errorResponse('Không tìm thấy bộ lọc', 404);
    }

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, query.projectId || '');
    const canUpdate = QueryPolicy.canUpdateQuery(user, query, userPermissions);

    if (!canUpdate) {
        return errorResponse('Bạn không có quyền chỉnh sửa bộ lọc này', 403);
    }


    const body = await req.json();
    const { name, isPublic, filters, columns, sortBy, sortOrder, groupBy } = body;

    // Check permission for making public
    if (isPublic && !query.isPublic) {
        const canMakePublic = QueryPolicy.canMakePublic(user, userPermissions);

        if (!canMakePublic) {
            return errorResponse('Không có quyền đặt bộ lọc thành công khai', 403);
        }
    }


    const updated = await prisma.query.update({
        where: { id },
        data: {
            ...(name && { name: name.trim() }),
            ...(isPublic !== undefined && { isPublic }),
            ...(filters && { filters: JSON.stringify(filters) }),
            ...(columns !== undefined && { columns: columns ? JSON.stringify(columns) : null }),
            ...(sortBy !== undefined && { sortBy }),
            ...(sortOrder !== undefined && { sortOrder }),
            ...(groupBy !== undefined && { groupBy }),
        },
        include: {
            user: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
        },
    });

    return successResponse({
        ...updated,
        filters: JSON.parse(updated.filters),
        columns: updated.columns ? JSON.parse(updated.columns) : null,
    });
});

// DELETE /api/queries/[id]
export const DELETE = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    const query = await prisma.query.findUnique({ where: { id } });
    if (!query) {
        return errorResponse('Không tìm thấy bộ lọc', 404);
    }

    // Authorization Policy check
    const canDelete = QueryPolicy.canDeleteQuery(user, query);

    if (!canDelete) {
        return errorResponse('Bạn không có quyền xóa bộ lọc này', 403);
    }


    await prisma.query.delete({ where: { id } });

    return successResponse({ message: 'Đã xóa bộ lọc' });
});
