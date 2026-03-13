import prisma from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';
import * as QueryPolicy from '@/server/policies/query.policy';

import { SessionUser } from '@/types';

export class QueryServerService {
    static async getQueries(user: SessionUser, searchParams: URLSearchParams) {
        const projectId = searchParams.get('projectId');
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

        return queries;
    }

    static async createQuery(user: SessionUser, data: any) {
        const {
            name,
            projectId,
            isPublic,
            filters,
            columns,
            sortBy,
            sortOrder,
            groupBy,
        } = data;

        if (!name?.trim()) throw new Error('Vui lòng nhập tên bộ lọc');
        if (!filters || typeof filters !== 'object') throw new Error('Tiêu chí lọc là bắt buộc');

        if (isPublic) {
            const userPermissions = await getUserPermissions(user.id, projectId || '');
            const canManagePublic = QueryPolicy.canCreatePublicQuery(user, userPermissions);

            if (!canManagePublic) throw new Error('Không có quyền tạo bộ lọc công khai');
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

        return query;
    }

    static async getQueryById(user: SessionUser, id: string) {
        const query = await prisma.query.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        if (!query) throw new Error('Không tìm thấy bộ lọc');

        const canView = QueryPolicy.canViewQuery(user, query);

        if (!canView) throw new Error('Bạn không có quyền truy cập bộ lọc này');

        return {
            ...query,
            filters: JSON.parse(query.filters),
            columns: query.columns ? JSON.parse(query.columns) : null,
        };
    }

    static async updateQuery(user: SessionUser, id: string, data: any) {
        const query = await prisma.query.findUnique({ where: { id } });
        if (!query) throw new Error('Không tìm thấy bộ lọc');

        const userPermissions = await getUserPermissions(user.id, query.projectId || '');
        const canUpdate = QueryPolicy.canUpdateQuery(user, query, userPermissions);

        if (!canUpdate) throw new Error('Bạn không có quyền chỉnh sửa bộ lọc này');

        const { name, isPublic, filters, columns, sortBy, sortOrder, groupBy } = data;

        if (isPublic && !query.isPublic) {
            const canMakePublic = QueryPolicy.canMakePublic(user, userPermissions);

            if (!canMakePublic) throw new Error('Không có quyền đặt bộ lọc thành công khai');
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

        return {
            ...updated,
            filters: JSON.parse(updated.filters),
            columns: updated.columns ? JSON.parse(updated.columns) : null,
        };
    }

    static async deleteQuery(user: SessionUser, id: string) {
        const query = await prisma.query.findUnique({ where: { id } });
        if (!query) throw new Error('Không tìm thấy bộ lọc');

        const canDelete = QueryPolicy.canDeleteQuery(user, query);

        if (!canDelete) throw new Error('Bạn không có quyền xóa bộ lọc này');

        await prisma.query.delete({ where: { id } });
        return true;
    }
}
