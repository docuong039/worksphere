import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { updateProjectSchema } from '@/lib/validations';
import { logUpdate, logDelete } from '@/lib/audit-log';

interface Params {
    params: Promise<{ id: string }>;
}

// Helper: Check if user is project member or admin
async function canAccessProject(userId: string, projectId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    const membership = await prisma.projectMember.findFirst({
        where: { userId, projectId },
    });

    return !!membership;
}

// Helper: Check if user can manage project (is creator/owner or admin)
async function canManageProject(userId: string, projectId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { creatorId: true },
    });

    return project?.creatorId === userId;
}

// GET /api/projects/[id] - Lấy chi tiết project
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Kiểm tra quyền xem project
        const canAccess = await canAccessProject(
            session.user.id,
            id,
            session.user.isAdministrator
        );

        if (!canAccess) {
            return errorResponse('Không có quyền truy cập dự án này', 403);
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                        role: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                    },
                },
            },
        });

        if (!project) {
            return errorResponse('Dự án không tồn tại', 404);
        }

        // Thêm thống kê tasks
        const taskStats = await prisma.task.groupBy({
            by: ['statusId'],
            where: { projectId: id },
            _count: { id: true },
        });

        const statuses = await prisma.status.findMany();
        const tasksByStatus = statuses.map((status) => ({
            status,
            count: taskStats.find((ts) => ts.statusId === status.id)?._count.id || 0,
        }));

        return successResponse({
            ...project,
            tasksByStatus,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/projects/[id] - Cập nhật project
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Kiểm tra quyền quản lý project
        const canManage = await canManageProject(
            session.user.id,
            id,
            session.user.isAdministrator
        );

        if (!canManage) {
            return errorResponse('Không có quyền sửa dự án này', 403);
        }

        // Lấy thông tin cũ để so sánh cho audit log
        const currentProject = await prisma.project.findUnique({
            where: { id },
            select: { name: true, description: true, identifier: true, isArchived: true },
        });

        const body = await req.json();
        const validatedData = updateProjectSchema.parse(body);

        // Nếu đổi identifier, kiểm tra unique
        if (validatedData.identifier) {
            const existing = await prisma.project.findFirst({
                where: {
                    identifier: validatedData.identifier,
                    id: { not: id },
                },
            });

            if (existing) {
                return errorResponse('Định danh dự án đã tồn tại', 400);
            }
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                ...validatedData,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
            },
            include: {
                creator: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { tasks: true, members: true },
                },
            },
        });

        // Ghi nhật ký hoạt động
        if (currentProject) {
            await logUpdate('project', id, session.user.id,
                { name: currentProject.name, description: currentProject.description, isArchived: currentProject.isArchived },
                { name: project.name, description: project.description, isArchived: project.isArchived }
            );
        }

        return successResponse(project);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE /api/projects/[id] - Xóa project
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id } = await params;

        // Kiểm tra quyền quản lý project
        const canManage = await canManageProject(
            session.user.id,
            id,
            session.user.isAdministrator
        );

        if (!canManage) {
            return errorResponse('Không có quyền xóa dự án này', 403);
        }

        // Lấy thông tin project trước khi xóa để ghi vào log
        const projectToDelete = await prisma.project.findUnique({
            where: { id },
            select: { name: true, identifier: true },
        });

        // Xóa tất cả liên quan (cascade)
        // 1. Xóa comments của tasks
        await prisma.comment.deleteMany({
            where: { task: { projectId: id } },
        });

        // 2. Xóa attachments của tasks
        await prisma.attachment.deleteMany({
            where: { task: { projectId: id } },
        });

        // 4. Xóa watchers của tasks
        await prisma.watcher.deleteMany({
            where: { task: { projectId: id } },
        });

        // 5. Xóa tasks
        await prisma.task.deleteMany({
            where: { projectId: id },
        });

        // 6. Xóa project members
        await prisma.projectMember.deleteMany({
            where: { projectId: id },
        });

        // 7. Xóa project
        await prisma.project.delete({
            where: { id },
        });

        // Ghi nhật ký hoạt động
        await logDelete('project', id, session.user.id, {
            name: projectToDelete?.name,
            identifier: projectToDelete?.identifier,
        });

        return successResponse({ message: 'Đã xóa dự án và tất cả dữ liệu liên quan' });
    } catch (error) {
        return handleApiError(error);
    }
}
