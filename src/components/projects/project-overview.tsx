import Link from 'next/link';
import { ListTodo, Users, ArrowRight } from 'lucide-react';
import type { DateLike } from '@/lib/date-utils';
import Image from 'next/image';

export interface Status {
    id: string;
    name: string;
    isClosed: boolean;
}

export interface Priority {
    id: string;
    name: string;
    color: string | null;
}

export interface Task {
    id: string;
    number: number;
    title: string;

    status: Status;
    priority: Priority;
    assignee: {
        id: string;
        name: string;
        avatar: string | null;
    } | null;
    updatedAt: DateLike;
}

export interface Member {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
    };
    role: {
        id: string;
        name: string;
    };
}

export interface Project {
    id: string;
    name: string;
    identifier: string;
    description: string | null;
    startDate: DateLike | null;
    endDate: DateLike | null;
    isArchived: boolean;
    creator: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
    };
    members: Member[];
    _count: {
        tasks: number;
        members: number;
    };
}

interface ProjectOverviewProps {
    project: Project;
    tasksByStatus: Array<{ status: Status; count: number }>;
    recentTasks: Task[];
}

export function ProjectOverview({
    project,
    tasksByStatus,
    recentTasks,
}: ProjectOverviewProps) {
    // Calculate completion rate
    const completedTasks = tasksByStatus
        .filter((ts) => ts.status.isClosed)
        .reduce((sum, ts) => sum + ts.count, 0);
    const completionRate =
        project._count.tasks > 0
            ? Math.round((completedTasks / project._count.tasks) * 100)
            : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <ListTodo className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-semibold text-gray-900">
                                {project._count.tasks}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Công việc</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-semibold text-gray-900">
                                {project._count.members}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Thành viên</p>
                    </div>


                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-lg">📊</span>
                            </div>
                            <span className="text-2xl font-semibold text-gray-900">{completionRate}%</span>
                        </div>
                        <p className="text-sm text-gray-500">Hoàn thành</p>
                    </div>
                </div>

                {/* Task Status Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bổ công việc</h3>

                    {project._count.tasks > 0 ? (
                        <>
                            {/* Progress Bar */}
                            <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 mb-4">
                                {tasksByStatus.map((ts, index) => {
                                    const percentage = (ts.count / project._count.tasks) * 100;
                                    if (percentage === 0) return null;

                                    const colors = [
                                        'bg-blue-500',
                                        'bg-yellow-500',
                                        'bg-purple-500',
                                        'bg-green-500',
                                        'bg-red-500',
                                    ];

                                    return (
                                        <div
                                            key={ts.status.id}
                                            className={colors[index % colors.length]}
                                            style={{ width: `${percentage}%` }}
                                            title={`${ts.status.name}: ${ts.count}`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-3 gap-3">
                                {tasksByStatus.map((ts, index) => {
                                    const colors = [
                                        'bg-blue-500',
                                        'bg-yellow-500',
                                        'bg-purple-500',
                                        'bg-green-500',
                                        'bg-red-500',
                                    ];

                                    return (
                                        <div key={ts.status.id} className="flex items-center gap-2 text-sm">
                                            <span className={`w-3 h-3 rounded ${colors[index % colors.length]}`} />
                                            <span className="text-gray-600">{ts.status.name}</span>
                                            <span className="text-gray-400">({ts.count})</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Chưa có công việc nào</p>
                    )}
                </div>

                {/* Recent Tasks */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Công việc gần đây</h3>
                        <Link
                            href={`/projects/${project.id}/tasks`}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Xem tất cả
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentTasks.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {recentTasks.map((task) => (
                                <Link
                                    key={task.id}
                                    href={`/tasks/${task.id}`}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: task.priority.color || '#6b7280' }}
                                        />
                                        <span className="text-gray-400 text-xs font-normal">#{task.number}</span>
                                        <span className="text-sm text-gray-900">{task.title}</span>

                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${task.status.isClosed
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {task.status.name}
                                        </span>
                                        {task.assignee && (
                                            <div
                                                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden"
                                                title={task.assignee.name}
                                            >
                                                {task.assignee.avatar ? (
                                                    <Image
                                                        src={task.assignee.avatar}
                                                        alt={task.assignee.name}
                                                        width={24}
                                                        height={24}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-600">
                                                        {task.assignee.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Chưa có công việc nào</p>
                    )}
                </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
                {/* Project Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin dự án</h3>

                    {project.description && (
                        <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                    )}

                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Người tạo</dt>
                            <dd className="text-gray-900">{project.creator.name}</dd>
                        </div>

                        {project.startDate && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Ngày bắt đầu</dt>
                                <dd className="text-gray-900">
                                    {new Date(project.startDate).toLocaleDateString('vi-VN')}
                                </dd>
                            </div>
                        )}

                        {project.endDate && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Ngày kết thúc</dt>
                                <dd className="text-gray-900">
                                    {new Date(project.endDate).toLocaleDateString('vi-VN')}
                                </dd>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <dt className="text-gray-500">Trạng thái</dt>
                            <dd>
                                {project.isArchived ? (
                                    <span className="text-orange-600">Đã lưu trữ</span>
                                ) : (
                                    <span className="text-green-600">Đang hoạt động</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Team Members */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Thành viên</h3>
                        <Link
                            href={`/projects/${project.id}/members`}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            Quản lý
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {project.members.slice(0, 5).map((member) => (
                            <div key={member.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                    {member.user.avatar ? (
                                        <Image
                                            src={member.user.avatar}
                                            alt={member.user.name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-600">
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {member.user.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{member.role.name}</p>
                                </div>
                            </div>
                        ))}

                        {project.members.length > 5 && (
                            <Link
                                href={`/projects/${project.id}/members`}
                                className="block text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                            >
                                +{project.members.length - 5} thành viên khác
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
