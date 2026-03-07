'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Calendar,
    User,
    AlertCircle,
} from 'lucide-react';

interface Task {
    id: string;
    number: number;
    title: string;
    doneRatio: number;

    status: { id: string; name: string; isClosed: boolean };
    priority: { id: string; name: string; color: string | null };
    tracker: { id: string; name: string };
    assignee: { id: string; name: string; avatar: string | null } | null;
}

interface Version {
    id: string;
    name: string;
    description: string | null;
    status: string;
    dueDate: string | null;
    tasks: Task[];
    progress: {
        total: number;
        closed: number;
        open: number;
        doneRatio: number;
        percentage: number;
    };
    tasksByStatus: Record<string, Task[]>;
}

interface RoadmapViewProps {
    projectId: string;
    versions: Version[];
    backlog: { tasks: Task[]; count: number };
}

export function RoadmapView({ projectId, versions, backlog }: RoadmapViewProps) {
    const [expandedVersions, setExpandedVersions] = useState<string[]>(
        versions.filter((v) => v.status === 'open').map((v) => v.id)
    );

    const toggleVersion = (id: string) => {
        setExpandedVersions((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-green-100 text-green-800';
            case 'locked':
                return 'bg-yellow-100 text-yellow-800';
            case 'closed':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open':
                return 'Đang mở';
            case 'locked':
                return 'Đã khóa';
            case 'closed':
                return 'Đã đóng';
            default:
                return status;
        }
    };

    return (
        <div className="space-y-6">
            {/* Versions */}
            {versions.map((version) => {
                const isExpanded = expandedVersions.includes(version.id);
                const isOverdue =
                    version.dueDate &&
                    new Date(version.dueDate) < new Date() &&
                    version.status === 'open';

                return (
                    <div
                        key={version.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                        {/* Version Header */}
                        <div
                            className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleVersion(version.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {version.name}
                                            </h3>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                                                    version.status
                                                )}`}
                                            >
                                                {getStatusLabel(version.status)}
                                            </span>
                                            {isOverdue && (
                                                <span className="flex items-center gap-1 text-xs text-red-600">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Quá hạn
                                                </span>
                                            )}
                                        </div>
                                        {version.dueDate && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                Hạn: {new Date(version.dueDate).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Progress */}
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                            {version.progress.closed}/{version.progress.total} đã xong
                                        </p>
                                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${version.progress.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-300">
                                        {version.progress.percentage}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Version Tasks */}
                        {isExpanded && (
                            <div className="border-t border-gray-200">
                                {version.description && (
                                    <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                                        {version.description}
                                    </div>
                                )}

                                {version.tasks.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {version.tasks.map((task) => (
                                            <Link
                                                key={task.id}
                                                href={`/tasks/${task.id}`}
                                                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                                            >
                                                <CheckSquare
                                                    className={`w-4 h-4 ${task.status.isClosed
                                                        ? 'text-green-500'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-sm truncate ${task.status.isClosed
                                                            ? 'text-gray-500 line-through'
                                                            : 'text-gray-900'
                                                            }`}
                                                    >
                                                        <span className="text-gray-400 mr-2 text-xs font-normal">#{task.number}</span>
                                                        {task.title}
                                                    </p>

                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {task.tracker.name}
                                                </span>
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: task.priority.color
                                                            ? `${task.priority.color}20`
                                                            : '#f3f4f6',
                                                        color: task.priority.color || '#6b7280',
                                                    }}
                                                >
                                                    {task.priority.name}
                                                </span>
                                                {task.assignee && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <User className="w-3 h-3" />
                                                        {task.assignee.name}
                                                    </span>
                                                )}
                                                <div className="w-16">
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${task.doneRatio}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-6 py-8 text-center text-gray-500 text-sm">
                                        Chưa có công việc nào
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Backlog */}
            {backlog.count > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Danh sách tồn đọng{' '}
                            <span className="text-sm font-normal text-gray-500">
                                ({backlog.count} công việc chưa gán phiên bản)
                            </span>
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {backlog.tasks.slice(0, 10).map((task) => (
                            <Link
                                key={task.id}
                                href={`/tasks/${task.id}`}
                                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50"
                            >
                                <CheckSquare className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">
                                        <span className="text-gray-400 mr-2 text-xs">#{task.number}</span>
                                        {task.title}
                                    </p>
                                </div>

                                <span className="text-xs text-gray-500">{task.tracker.name}</span>
                            </Link>
                        ))}
                        {backlog.count > 10 && (
                            <div className="px-6 py-3 text-center">
                                <Link
                                    href={`/projects/${projectId}/tasks?versionId=`}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Xem tất cả {backlog.count} công việc
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {versions.length === 0 && backlog.count === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 px-6 py-12 text-center">
                    <p className="text-gray-500">Chưa có phiên bản nào được tạo.</p>
                    <Link
                        href={`/projects/${projectId}/versions`}
                        className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                        Tạo phiên bản mới
                    </Link>
                </div>
            )}
        </div>
    );
}
