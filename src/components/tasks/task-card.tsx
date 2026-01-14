'use client';

import { useDraggable } from '@dnd-kit/core';
import { MessageSquare, GitBranch, Clock, User, ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { TaskContextMenu } from './task-context-menu';

interface Status {
    id: string;
    name: string;
    isClosed: boolean;
}

interface Tracker {
    id: string;
    name: string;
}

interface Priority {
    id: string;
    name: string;
    color: string | null;
}

interface Subtask {
    id: string;
    number: number;
    title: string;
    status: { id: string; name: string; isClosed: boolean };
    assignee: { id: string; name: string; avatar: string | null } | null;
}

interface Task {
    id: string;
    number: number;
    title: string;
    doneRatio: number;
    tracker: { id: string; name: string };
    status: { id: string; name: string; isClosed: boolean };
    priority: { id: string; name: string; color: string | null };
    project: { id: string; name: string; identifier: string };
    assignee: { id: string; name: string; avatar: string | null } | null;
    parent: { id: string; number: number; title: string } | null;
    subtasks?: Subtask[];
    _count: { subtasks: number; comments: number };
    dueDate: string | Date | null;
}

interface TaskCardProps {
    task: Task;
    statuses: Status[];
    trackers: Tracker[];
    priorities: Priority[];
    onRefresh: () => void;
}

export function TaskCard({ task, statuses, trackers, priorities, onRefresh }: TaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [updatingSubtask, setUpdatingSubtask] = useState<string | null>(null);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: {
            task,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
    } : undefined;

    const formatDate = (date: string | Date | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    };

    const dueDate = formatDate(task.dueDate);
    const doneSubtasks = task.subtasks?.filter(s => s.status.isClosed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const handleSubtaskStatusToggle = async (subtask: Subtask) => {
        setUpdatingSubtask(subtask.id);
        try {
            // Find a status that is opposite of current (Closed vs Open)
            const targetStatus = statuses.find(s => s.isClosed === !subtask.status.isClosed);
            if (!targetStatus) return;

            const res = await fetch(`/api/tasks/${subtask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statusId: targetStatus.id }),
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Failed to update subtask', error);
        } finally {
            setUpdatingSubtask(null);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 ring-2 ring-blue-500 shadow-xl scale-[1.02]' : ''}`}
        >
            <div className="p-4 space-y-4">
                {/* Header: Tracker & Project */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0" {...listeners}>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                {task.tracker.name}
                            </span>
                            <span
                                className="px-2 py-0.5 text-[10px] font-bold text-white rounded-md shadow-sm"
                                style={{ backgroundColor: task.priority.color || '#94a3b8' }}
                            >
                                {task.priority.name}
                            </span>
                        </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <TaskContextMenu
                            taskId={task.id}
                            projectId={task.project.id}
                            currentStatusId={task.status.id}
                            currentTrackerId={task.tracker.id}
                            currentPriorityId={task.priority.id}
                            currentAssigneeId={task.assignee?.id || null}
                            currentDoneRatio={task.doneRatio}
                            statuses={statuses}
                            trackers={trackers}
                            priorities={priorities}
                            onRefresh={onRefresh}
                        />
                    </div>
                </div>

                {/* Title */}
                <div {...listeners}>
                    <Link
                        href={`/tasks/${task.id}`}
                        className={`text-[14px] font-bold leading-snug hover:text-blue-600 transition-colors block ${task.status.isClosed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                    >
                        <span className="text-gray-300 font-mono text-[11px] mr-2 italic">#{task.number}</span>
                        {task.title}
                    </Link>
                </div>

                {/* Subtasks Progress */}
                <div className="space-y-2" {...listeners}>
                    <div className="flex justify-between items-center px-0.5">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                <GitBranch className="w-3 h-3" />
                                <span>SUBTASKS: {doneSubtasks}/{totalSubtasks}</span>
                            </div>
                        </div>
                        <span className={`text-[11px] font-black ${task.doneRatio === 100 ? 'text-green-500' : 'text-blue-500'}`}>
                            {task.doneRatio}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                        <div
                            className={`h-full transition-all duration-500 ease-out ${task.doneRatio === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: `${task.doneRatio}%` }}
                        />
                    </div>
                </div>

                {/* Expandable Subtasks List */}
                {totalSubtasks > 0 && (
                    <div className="border-t border-gray-50 pt-2 -mx-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg group/btn transition-colors"
                        >
                            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Chi tiết subtasks</span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                        </button>

                        {isExpanded && (
                            <div className="mt-1 space-y-1 px-1">
                                {task.subtasks?.map(sub => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50/80 border border-transparent hover:border-gray-100 transition-all group/sub"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 mr-2">
                                            <button
                                                disabled={!!updatingSubtask}
                                                onClick={(e) => { e.stopPropagation(); handleSubtaskStatusToggle(sub); }}
                                                className={`shrink-0 transition-colors ${sub.status.isClosed ? 'text-green-500' : 'text-gray-300 hover:text-blue-400'}`}
                                            >
                                                {sub.status.isClosed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                            </button>
                                            <Link
                                                href={`/tasks/${sub.id}`}
                                                className={`text-[11px] font-medium truncate ${sub.status.isClosed ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {sub.title}
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {sub.assignee && (
                                                <div
                                                    className="w-5 h-5 rounded-full ring-2 ring-white overflow-hidden shadow-sm"
                                                    title={sub.assignee.name}
                                                >
                                                    {sub.assignee.avatar ? (
                                                        <Image src={sub.assignee.avatar} alt={sub.assignee.name} width={20} height={20} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                                            <User className="w-2.5 h-2.5 text-blue-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50" {...listeners}>
                    <div className="flex items-center gap-4 text-gray-400">
                        {dueDate && task.dueDate && (
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${new Date(task.dueDate) < new Date() && !task.status.isClosed ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{dueDate}</span>
                            </div>
                        )}
                        {task._count.comments > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{task._count.comments}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 hidden group-hover:block transition-all">
                            {task.assignee?.name || 'Unassigned'}
                        </span>
                        <div
                            className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-white"
                            title={task.assignee?.name || 'Chưa gán'}
                        >
                            {task.assignee?.avatar ? (
                                <Image src={task.assignee.avatar} alt={task.assignee.name} width={28} height={28} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-blue-400" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
