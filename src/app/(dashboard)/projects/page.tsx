import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProjectList } from '@/components/projects/project-list';

export default async function ProjectsPage() {
    const session = await auth();

    // Lấy projects dựa trên quyền
    const where = session?.user?.isAdministrator
        ? {}
        : { members: { some: { userId: session?.user?.id } } };

    const projects = await prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
            creator: {
                select: { id: true, name: true, avatar: true },
            },
            members: {
                take: 5,
                include: {
                    user: {
                        select: { id: true, name: true, avatar: true },
                    },
                },
            },
            _count: {
                select: { tasks: true, members: true },
            },
        },
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dự án</h1>
                    <p className="text-gray-500 mt-1">Quản lý các dự án của bạn</p>
                </div>
            </div>

            <ProjectList projects={projects} />
        </div>
    );
}
