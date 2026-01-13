import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createProjectSchema } from '@/lib/validations';
import { logCreate } from '@/lib/audit-log';

// GET /api/projects - Lấy danh sách projects
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status'); // active, archived, all
        const myProjects = searchParams.get('my') === 'true';

        // Base where clause
        let where: Record<string, unknown> = {};

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { identifier: { contains: search } },
                { description: { contains: search } },
            ];
        }

        // Status filter
        if (status === 'active') {
            where.isArchived = false;
        } else if (status === 'archived') {
            where.isArchived = true;
        }

        // Non-admin chỉ xem projects mình là member
        if (!session.user.isAdministrator || myProjects) {
            where.members = {
                some: { userId: session.user.id },
            };
        }

        const projects = await prisma.project.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                        role: {
                            select: { id: true, name: true },
                        },
                    },
                },
                _count: {
                    select: { tasks: true, members: true },
                },
            },
        });

        return successResponse(projects);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/projects - Tạo project mới
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        // Kiểm tra quyền tạo project
        // Admin luôn được tạo, non-admin cần check permission
        if (!session.user.isAdministrator) {
            const hasPermission = await checkPermission(session.user.id, 'projects.create');
            if (!hasPermission) {
                return errorResponse('Không có quyền tạo dự án', 403);
            }
        }

        const body = await req.json();
        console.log('Project Creation Request Body:', body);
        const validatedData = createProjectSchema.parse(body);

        // Kiểm tra identifier unique
        const existing = await prisma.project.findUnique({
            where: { identifier: validatedData.identifier },
        });

        if (existing) {
            console.log('Project Creation Error: Identifier already exists:', validatedData.identifier);
            return errorResponse('Định danh dự án đã tồn tại', 400);
        }

        // Lấy default Manager role
        const managerRole = await prisma.role.findFirst({
            where: { name: 'Manager' },
        });

        // Tạo project và thêm creator làm member với role Manager
        const project = await prisma.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                identifier: validatedData.identifier,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                creatorId: session.user.id,
                members: managerRole
                    ? {
                        create: {
                            userId: session.user.id,
                            roleId: managerRole.id,
                        },
                    }
                    : undefined,
            },
            include: {
                creator: {
                    select: { id: true, name: true },
                },
                members: {
                    include: {
                        user: { select: { id: true, name: true } },
                        role: { select: { id: true, name: true } },
                    },
                },
                _count: {
                    select: { tasks: true, members: true },
                },
            },
        });

        // Enable all trackers for the new project by default
        const allTrackers = await prisma.tracker.findMany({ select: { id: true } });
        if (allTrackers.length > 0) {
            await prisma.projectTracker.createMany({
                data: allTrackers.map(t => ({
                    projectId: project.id,
                    trackerId: t.id
                }))
            });
        }

        // Ghi nhật ký hoạt động
        await logCreate('project', project.id, session.user.id, {
            name: project.name,
            identifier: validatedData.identifier,
        });

        return successResponse(project, 201);
    } catch (error) {
        console.error('Project Creation Error:', error);
        return handleApiError(error);
    }
}

// Helper: Check permission
async function checkPermission(userId: string, permissionKey: string): Promise<boolean> {
    const memberships = await prisma.projectMember.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    for (const membership of memberships) {
        const hasPermission = membership.role.permissions.some(
            (rp) => rp.permission.key === permissionKey
        );
        if (hasPermission) return true;
    }

    return false;
}
