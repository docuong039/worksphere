import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { ProjectTabs } from '@/components/projects/project-tabs';

interface Props {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) redirect('/login');

    // Access check
    const canAccess =
        session.user.isAdministrator ||
        (await prisma.projectMember.findFirst({
            where: { userId: session.user.id, projectId: id },
        }));

    if (!canAccess) notFound();

    // Fetch minimal project info for header
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true, identifier: true }
    });

    if (!project) notFound();

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/projects"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                        <p className="text-gray-500">{project.identifier}</p>
                    </div>
                </div>

                <Link
                    href={`/projects/${id}/settings`}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                    <Settings className="w-4 h-4" />
                    Cài đặt
                </Link>
            </div>

            {/* Tabs */}
            <ProjectTabs projectId={id} />

            {/* Content */}
            {children}
        </div>
    );
}
