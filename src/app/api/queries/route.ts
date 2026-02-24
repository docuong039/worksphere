import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { getUserPermissions } from '@/lib/permissions';
import * as QueryPolicy from '@/modules/query/query.policy';
import { withAuth } from '@/server/middleware/withAuth';
import { PERMISSIONS } from '@/lib/constants';


// GET /api/queries - List saved queries
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    // Get queries user has access to:
    // 1. Their own queries
    // 2. Public queries
    // 3. If admin, all queries
    const queries = await prisma.query.findMany({
        where: {
            OR: [
                { userId: user.id },
                { isPublic: true },
                ...(user.isAdministrator ? [{}] : []),
            ],
            ...(projectId ? { projectId } : {}),
        },
        include: {
            user: { select: { id: true, name: true } },
            project: { select: { id: true, name: true, identifier: true } },
        },
        orderBy: [{ isPublic: 'desc' }, { name: 'asc' }],
    });

    return successResponse(queries);
});

// POST /api/queries - Create a new saved query
export const POST = withAuth(async (req, user) => {
    const body = await req.json();
    const {
        name,
        projectId,
        isPublic,
        filters,
        columns,
        sortBy,
        sortOrder,
        groupBy,
    } = body;

    if (!name?.trim()) {
        return errorResponse('Vui lòng nhập tên bộ lọc', 400);
    }

    if (!filters || typeof filters !== 'object') {
        return errorResponse('Tiêu chí lọc là bắt buộc', 400);
    }

    // Only admins or users with manage_public_queries permission can create public queries
    if (isPublic) {
        const userPermissions = await getUserPermissions(user.id, projectId || '');
        const canManagePublic = QueryPolicy.canCreatePublicQuery(user, userPermissions);

        if (!canManagePublic) {
            return errorResponse('Không có quyền tạo bộ lọc công khai', 403);
        }
    }


    const query = await prisma.query.create({
        data: {
            name: name.trim(),
            projectId: projectId || null,
            userId: user.id,
            isPublic: isPublic || false,
            filters: JSON.stringify(filters),
            columns: columns ? JSON.stringify(columns) : null,
            sortBy: sortBy || null,
            sortOrder: sortOrder || 'asc',
            groupBy: groupBy || null,
        },
        include: {
            user: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
        },
    });

    return successResponse(query, 201);
});
