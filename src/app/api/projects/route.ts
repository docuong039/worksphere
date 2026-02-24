import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { createProjectSchema } from '@/lib/validations';
import { logCreate } from '@/lib/audit-log';
import { notifyProjectCreated } from '@/lib/notifications';
import { withAuth } from '@/server/middleware/withAuth';

import { PERMISSIONS } from '@/lib/constants';

// Import helpers
import {
    buildProjectFilters,
    PROJECT_LIST_INCLUDE,
} from './helpers';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';


// GET /api/projects - Lấy danh sách projects
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status'); // active, archived, all
    const myProjects = searchParams.get('my') === 'true';

    // Build filter using helper
    const where = buildProjectFilters({
        search,
        status,
        myProjects,
        userId: user.id,
        isAdmin: user.isAdministrator,
    });

    const projects = await prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: PROJECT_LIST_INCLUDE,
    });

    return successResponse(projects);
});

// POST /api/projects - Tạo project mới
export const POST = withAuth(async (req, user) => {
    // Verify user exists in DB (fix for P2003 error if DB was reset)
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true }
    });

    if (!dbUser) {
        console.error(`Session user ID ${user.id} not found in Database users table.`);
        return errorResponse('Tài khoản không tồn tại trong hệ thống (vui lòng đăng xuất và đăng nhập lại)', 401);
    }

    // 1. Check Permission: 'projects.create'
    const globalPermissions = await getUserPermissions(user.id, ''); // No project ID for global creation check
    const canCreate = ProjectPolicy.canCreateProject(user, globalPermissions);

    if (!canCreate) {
        return errorResponse('Bạn không có quyền tạo dự án', 403);
    }


    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    // Kiểm tra identifier unique
    const existing = await prisma.project.findUnique({
        where: { identifier: validatedData.identifier },
    });

    if (existing) {
        return errorResponse('Định danh dự án đã tồn tại', 400);
    }

    // 1. Get default Manager role
    // Ưu tiên tìm role 'Manager' hoặc 'Project Manager' hoặc lấy role đầu tiên có quyền quản lý
    let managerRole = await prisma.role.findFirst({
        where: { name: { in: ['Manager', 'Project Manager', 'Quản lý'] } },
    });

    // Fallback: Lấy role đầu tiên nếu không có manager (để tránh lỗi không tạo được member)
    // Tuy nhiên tốt nhất là nên fail nếu system chưa setup role
    if (!managerRole) {
        console.warn('Warning: No "Manager" role found. Looking for any role.');
        managerRole = await prisma.role.findFirst();
    }

    if (!managerRole) {
        return errorResponse('Hệ thống chưa cấu hình Role nào. Vui lòng liên hệ Admin.', 500);
    }

    const allTrackers = await prisma.tracker.findMany({ select: { id: true } });

    // Sử dụng Transaction để đảm bảo tính toàn vẹn
    const project = await prisma.$transaction(async (tx) => {
        // 2. Create Project & Member
        const newProject = await tx.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                identifier: validatedData.identifier,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
                creatorId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        roleId: managerRole!.id, // Chắc chắn tồn tại
                    },
                },
            },
            include: PROJECT_LIST_INCLUDE,
        });

        // 3. Enable all trackers
        if (allTrackers.length > 0) {
            await tx.projectTracker.createMany({
                data: allTrackers.map((t) => ({
                    projectId: newProject.id,
                    trackerId: t.id,
                })),
            });
        }

        return newProject;
    });

    // Ghi nhật ký hoạt động (ngoài transaction để không block)
    logCreate('project', project.id, user.id, {
        name: project.name,
        identifier: validatedData.identifier,
    });

    // Gửi thông báo cho admins (fire-and-forget)
    notifyProjectCreated(project.id, project.name, user.id, user.name || 'Ai đó');

    return successResponse(project, 201);
});
