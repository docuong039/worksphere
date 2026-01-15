'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { toast } from 'sonner';
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    GitBranch,
    CheckCircle,
    Layers,
    AlertTriangle,
    User,
    Percent,
    Loader2,
    Copy,
} from 'lucide-react';

import { CopyTaskModal } from './copy-task-modal';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Status {
    id: string;
    name: string;
    isClosed?: boolean;
}

interface Tracker {
    id: string;
    name: string;
}

interface Priority {
    id: string;
    name: string;
    color?: string | null;
}

interface Member {
    user: { id: string; name: string };
}

interface Project {
    id: string;
    name: string;
    identifier: string;
}

interface TaskData {
    id: string;
    title: string;
    description: string | null;
    trackerId: string;
    statusId: string;
    priorityId: string;
    assigneeId: string | null;
    versionId: string | null;
    estimatedHours: number | null;
    doneRatio: number;
    startDate: string | Date | null;
    dueDate: string | Date | null;
    isPrivate: boolean;
    projectId: string;
    hasSubtasks: boolean;
}

interface TaskContextMenuProps {
    taskId: string;
    taskTitle: string;
    projectId: string;
    currentStatusId: string;
    currentTrackerId: string;
    currentPriorityId: string;
    currentAssigneeId: string | null;
    currentDoneRatio: number;
    hasSubtasks?: boolean;
    statuses: Status[];
    trackers: Tracker[];
    priorities: Priority[];
    onRefresh: () => void;
}

export function TaskContextMenu({
    taskId,
    projectId,
    currentStatusId,
    currentTrackerId,
    currentPriorityId,
    currentAssigneeId,
    currentDoneRatio,
    statuses,
    trackers,
    priorities,
    onRefresh,
}: TaskContextMenuProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [taskData, setTaskData] = useState<TaskData | null>(null);
    const [loadingTask, setLoadingTask] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch projects when Copy modal is opened
    const fetchProjects = async () => {
        if (projects.length > 0) return;
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    // Fetch full task data for copy modal
    const fetchTaskData = async () => {
        setLoadingTask(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}`);
            if (res.ok) {
                const data = await res.json();
                const task = data.data;
                setTaskData({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    trackerId: task.tracker.id,
                    statusId: task.status.id,
                    priorityId: task.priority.id,
                    assigneeId: task.assignee?.id || null,
                    versionId: task.version?.id || null,
                    estimatedHours: task.estimatedHours,
                    doneRatio: task.doneRatio,
                    startDate: task.startDate,
                    dueDate: task.dueDate,
                    isPrivate: task.isPrivate || false,
                    projectId: task.project.id,
                    hasSubtasks: task.subtasks && task.subtasks.length > 0,
                });
                setShowCopyModal(true);
            }
        } catch (err) {
            console.error('Failed to fetch task data', err);
        } finally {
            setLoadingTask(false);
        }
    };

    const handleOpenCopyModal = async () => {
        await fetchProjects();
        await fetchTaskData();
    };


    if (!isMounted) {
        return (
            <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        );
    }

    // Fetch members when Assignee submenu is opened
    const fetchMembers = async () => {
        if (members.length > 0) return; // Already fetched
        setLoadingMembers(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch members', err);
        }
        setLoadingMembers(false);
    };

    const handleQuickUpdate = async (field: string, value: string | number | null) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            if (res.ok) {
                toast.success('Đã cập nhật công việc');
                onRefresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;

        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Đã xóa công việc');
                onRefresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Không thể xóa');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    const doneRatioOptions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem asChild>
                        <Link href={`/tasks/${taskId}`} className="flex items-center gap-2 cursor-pointer">
                            <Pencil className="w-4 h-4" />
                            Chỉnh sửa
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link href={`/tasks/${taskId}`} className="flex items-center gap-2 cursor-pointer">
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Status Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Trạng thái
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-1">
                            {statuses.map((s) => (
                                <DropdownMenuItem
                                    key={s.id}
                                    onClick={() => handleQuickUpdate('statusId', s.id)}
                                    className={s.id === currentStatusId ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                >
                                    {s.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Tracker Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Layers className="mr-2 h-4 w-4" />
                            Tracker
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-1">
                            {trackers.map((t) => (
                                <DropdownMenuItem
                                    key={t.id}
                                    onClick={() => handleQuickUpdate('trackerId', t.id)}
                                    className={t.id === currentTrackerId ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                >
                                    {t.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Priority Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Độ ưu tiên
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-1">
                            {priorities.map((p) => (
                                <DropdownMenuItem
                                    key={p.id}
                                    onClick={() => handleQuickUpdate('priorityId', p.id)}
                                    className={p.id === currentPriorityId ? 'bg-blue-50 font-medium' : ''}
                                >
                                    <span
                                        className="mr-2 w-2 h-2 rounded-full"
                                        style={{ backgroundColor: p.color || '#6b7280' }}
                                    />
                                    {p.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Assignee Submenu */}
                    <DropdownMenuSub onOpenChange={(open) => open && fetchMembers()}>
                        <DropdownMenuSubTrigger>
                            <User className="mr-2 h-4 w-4" />
                            Người thực hiện
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48 p-1 max-h-60 overflow-auto">
                            {loadingMembers ? (
                                <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang tải...
                                </div>
                            ) : (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => handleQuickUpdate('assigneeId', null)}
                                        className={!currentAssigneeId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 italic'}
                                    >
                                        -- Chưa gán --
                                    </DropdownMenuItem>
                                    {members.map((m) => (
                                        <DropdownMenuItem
                                            key={m.user.id}
                                            onClick={() => handleQuickUpdate('assigneeId', m.user.id)}
                                            className={m.user.id === currentAssigneeId ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                        >
                                            {m.user.name}
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Done Ratio Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Percent className="mr-2 h-4 w-4" />
                            % Hoàn thành
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-32 p-1 max-h-60 overflow-auto">
                            {doneRatioOptions.map((ratio) => (
                                <DropdownMenuItem
                                    key={ratio}
                                    onClick={() => handleQuickUpdate('doneRatio', ratio)}
                                    className={ratio === currentDoneRatio ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                >
                                    {ratio}%
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    {/* Add Subtask */}
                    <DropdownMenuItem asChild>
                        <Link href={`/tasks/${taskId}#subtasks`} className="flex items-center gap-2 cursor-pointer">
                            <GitBranch className="w-4 h-4" />
                            Thêm công việc con
                        </Link>
                    </DropdownMenuItem>

                    {/* Copy Task */}
                    <DropdownMenuItem
                        onClick={handleOpenCopyModal}
                        disabled={loadingTask}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Copy className="w-4 h-4" />
                        {loadingTask ? 'Đang tải...' : 'Sao chép'}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Delete */}
                    <DropdownMenuItem
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Copy Task Modal */}
            {taskData && (
                <CopyTaskModal
                    isOpen={showCopyModal}
                    onClose={() => {
                        setShowCopyModal(false);
                        setTaskData(null);
                    }}
                    taskData={taskData}
                    projects={projects}
                    trackers={trackers}
                    statuses={statuses}
                    priorities={priorities}
                />
            )}
        </>
    );
}
