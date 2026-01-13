import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
    Briefcase,
    CheckSquare,
    ArrowRight,
    AlertCircle,
} from 'lucide-react';

export default async function DashboardPage() {
    const session = await auth();

    if (!session) return null;

    // Get Stats
    const [
        totalProjects,
        myAssignedTasksCount,
        myOpenTasks,
        myProjects,
    ] = await Promise.all([
        // Total projects
        session.user.isAdministrator
            ? prisma.project.count()
            : prisma.project.count({
                where: { members: { some: { userId: session.user.id } } },
            }),

        // Tasks assigned to me
        prisma.task.count({
            where: {
                assigneeId: session.user.id,
                status: { isClosed: false },
            },
        }),

        // My Open Tasks (limit 5)
        prisma.task.findMany({
            where: {
                assigneeId: session.user.id,
                status: { isClosed: false },
            },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: {
                project: { select: { id: true, name: true, identifier: true } },
                status: { select: { name: true } },
                priority: { select: { name: true, color: true } },
                tracker: { select: { name: true } }
            },
        }),

        // My Projects (limit 5)
        session.user.isAdministrator
            ? prisma.project.findMany({ take: 5, orderBy: { updatedAt: 'desc' } })
            : prisma.project.findMany({
                where: { members: { some: { userId: session.user.id } } },
                take: 5,
                orderBy: { updatedAt: 'desc' }
            }),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Tổng quan</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Dự án tham gia</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalProjects}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Công việc của tôi</p>
                            <h3 className="text-2xl font-bold text-gray-900">{myAssignedTasksCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Tasks */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Công việc cần làm
                        </h2>
                        <Link href="/tasks?myTasks=true" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-0 flex-1">
                        {myOpenTasks.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {myOpenTasks.map(task => (
                                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <Link href={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
                                                {task.title}
                                            </Link>
                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 whitespace-nowrap ml-2">
                                                {task.status.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.priority.color || '#ccc' }}></span>
                                                {task.priority.name}
                                            </span>
                                            <span>•</span>
                                            <span>{task.project.name}</span>
                                            <span>•</span>
                                            <span>{task.tracker.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                Bạn không có công việc nào đang chờ xử lý.
                            </div>
                        )}
                    </div>
                </div>

                {/* My Projects */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Dự án của tôi</h2>
                        <Link href="/projects" className="text-sm text-blue-600 hover:underline">
                            Xem tất cả
                        </Link>
                    </div>
                    <div className="p-4 space-y-3">
                        {myProjects.length > 0 ? myProjects.map(proj => (
                            <Link key={proj.id} href={`/projects/${proj.id}`} className="block p-3 border border-gray-100 rounded hover:border-blue-200 hover:bg-blue-50 transition-all">
                                <div className="font-medium text-gray-900">{proj.name}</div>
                                <div className="text-xs text-gray-500 mt-1 truncate">{proj.description || 'Chưa có mô tả'}</div>
                            </Link>
                        )) : (
                            <p className="text-gray-500 text-sm">Chưa tham gia dự án nào.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
