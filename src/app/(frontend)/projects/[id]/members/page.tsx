import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ProjectMembers } from '@/components/projects/project-members';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectMembersPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) {
        redirect('/login');
    }

    // Get project with members (ẩn Administrator - họ quản lý hệ thống, không phải thành viên dự án)
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            members: {
                where: {
                    user: { isAdministrator: false }, // Ẩn admin khỏi danh sách thành viên
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatar: true, isActive: true },
                    },
                    role: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!project) {
        notFound();
    }

    // Check access - dùng query riêng để check access kể cả khi admin bị ẩn khỏi danh sách
    const isMember = await prisma.projectMember.count({
        where: { projectId: id, userId: session.user.id }
    }) > 0;

    if (!session.user.isAdministrator && !isMember) {
        notFound();
    }

    // Check if user can manage members
    const canManage =
        session.user.isAdministrator ||
        project.members.some(
            (m) =>
                m.user.id === session.user.id &&
                (project.creatorId === session.user.id || // is creator
                    m.role.name === 'Manager') // or has Manager role
        );

    // Get all active roles and users for adding (ẩn admin khỏi danh sách có thể thêm)
    const [roles, users] = await Promise.all([
        prisma.role.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.user.findMany({
            where: {
                isActive: true,
                isAdministrator: false, // Không thêm admin vào dự án
                id: { notIn: project.members.map((m) => m.user.id) },
            },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true, avatar: true },
        }),
    ]);

    return (
        <ProjectMembers
            projectId={id}
            members={project.members}
            roles={roles}
            availableUsers={users}
            canManage={canManage}
            creatorId={project.creatorId}
        />
    );
}
