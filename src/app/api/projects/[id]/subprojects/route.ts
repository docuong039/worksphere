import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import { PERMISSIONS } from '@/lib/constants';


// GET /api/projects/[id]/subprojects - Get child projects
export const GET = withAuth(async (_req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canView = ProjectPolicy.canViewProject(user, userPermissions);

    if (!canView) {
        return errorResponse('Không có quyền truy cập thông tin dự án con', 403);
    }


    const subprojects = await prisma.project.findMany({
        where: { parentId: id },
        select: {
            id: true,
            name: true,
            identifier: true,
            description: true,
            isArchived: true,
            isPublic: true,
            createdAt: true,
            _count: {
                select: {
                    tasks: true,
                    members: true,
                    children: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return successResponse(subprojects);
});

// POST /api/projects/[id]/subprojects - Create a subproject
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, id);
    const canCreate = ProjectPolicy.canCreateSubprojects(user, userPermissions);

    if (!canCreate) {
        return errorResponse('Không có quyền tạo dự án con cho dự án này', 403);
    }


    const body = await req.json();
    const { name, identifier, description, isPublic } = body;

    if (!name?.trim()) {
        return errorResponse('Vui lòng nhập tên', 400);
    }
    if (!identifier?.trim()) {
        return errorResponse('Vui lòng nhập định danh', 400);
    }

    // Check identifier uniqueness
    const existingProject = await prisma.project.findUnique({
        where: { identifier: identifier.toLowerCase() },
    });
    if (existingProject) {
        return errorResponse('Định danh dự án đã tồn tại', 400);
    }

    // Check max nesting level (e.g., 3 levels)
    const parentProject = await prisma.project.findUnique({
        where: { id },
        include: {
            parent: {
                include: {
                    parent: true,
                },
            },
        },
    });

    if (!parentProject) {
        return errorResponse('Không tìm thấy dự án cha', 404);
    }

    let nestingLevel = 1;
    if (parentProject.parent) {
        nestingLevel = 2;
        if (parentProject.parent.parent) {
            nestingLevel = 3;
        }
    }

    if (nestingLevel >= 3) {
        return errorResponse('Đã đạt giới hạn cấp lồng nhau tối đa (3 cấp)', 400);
    }

    // Create subproject
    const subproject = await prisma.project.create({
        data: {
            name: name.trim(),
            identifier: identifier.toLowerCase().trim(),
            description: description?.trim() || null,
            isPublic: isPublic || false,
            parentId: id,
            creatorId: user.id,
        },
        include: {
            creator: { select: { id: true, name: true } },
            _count: { select: { tasks: true, members: true } },
        },
    });

    // Optionally inherit members from parent
    const parentMembers = await prisma.projectMember.findMany({
        where: { projectId: id },
    });

    if (parentMembers.length > 0) {
        await prisma.projectMember.createMany({
            data: parentMembers.map(m => ({
                projectId: subproject.id,
                userId: m.userId,
                roleId: m.roleId,
            })),
            skipDuplicates: true,
        });
    }

    return successResponse(subproject, 201);
});
