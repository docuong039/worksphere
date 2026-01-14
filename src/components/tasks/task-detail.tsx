'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    MessageSquare,
    GitBranch,
    Pencil,
    X,
    Send,
    Plus,
} from 'lucide-react';
import { TaskWatchers } from './task-watchers';
import { TaskAttachments } from './task-attachments';
import { CreateTaskModal } from './create-task-modal';
import { TaskContextMenu } from './task-context-menu';

interface Status {
    id: string;
    name: string;
    isClosed?: boolean;
}

interface Priority {
    id: string;
    name: string;
    color?: string | null;
}

interface Tracker {
    id: string;
    name: string;
}

interface Member {
    user: { id: string; name: string; avatar: string | null };
    role: { id: string; name: string; canAssignToOther: boolean };
}

interface Comment {
    id: string;
    content: string;
    createdAt: string | Date;
    user: { id: string; name: string; avatar: string | null };
}

interface Child {
    id: string;
    number: number;
    title: string;
    doneRatio?: number;
    startDate?: string | Date | null;
    dueDate?: string | Date | null;
    status: Status;
    priority: { id: string; color: string | null };
    assignee: { id: string; name: string; avatar: string | null } | null;
    tracker: { id: string; name: string };
}

interface Version {
    id: string;
    name: string;
    status: string;
}

interface Task {
    id: string;
    number: number;
    title: string;
    description: string | null;
    estimatedHours: number | null;
    doneRatio: number;
    startDate: string | Date | null;
    dueDate: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    tracker: Tracker;
    status: Status;
    priority: Priority;
    project: {
        id: string;
        name: string;
        identifier: string;
        members?: Member[];
    };
    assignee: { id: string; name: string; avatar: string | null } | null;
    creator: { id: string; name: string; avatar: string | null };
    parent: { id: string; number: number; title: string } | null;

    version: { id: string; name: string; status: string } | null;
    subtasks: Child[];
    comments: Comment[];
    watchers: Array<{ userId: string; user: { id: string; name: string; avatar: string | null } }>;
    attachments: Array<{
        id: string;
        filename: string;
        path: string;
        size: number;
        mimeType: string;
        createdAt: string | Date;
        user: { id: string; name: string };
    }>;
}

interface TaskDetailProps {
    task: Task;
    trackers: Tracker[];
    statuses: Status[];
    priorities: Priority[];
    versions?: Version[];
    allowedStatuses: Status[];
    canEdit: boolean;
    canManageWatchers?: boolean;
    currentUserId: string;
    systemSettings?: {
        parent_issue_dates: 'calculated' | 'independent';
        parent_issue_priority: 'calculated' | 'independent';
        parent_issue_done_ratio: 'calculated' | 'independent';
        parent_issue_estimated_hours: 'calculated' | 'independent';
    };
}

export function TaskDetail({
    task,
    trackers,
    statuses,
    priorities,
    allowedStatuses,
    versions = [],
    canEdit,
    canManageWatchers = false,
    currentUserId,
    systemSettings = {
        parent_issue_dates: 'calculated',
        parent_issue_priority: 'calculated',
        parent_issue_done_ratio: 'calculated',
        parent_issue_estimated_hours: 'calculated'
    }
}: TaskDetailProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [editData, setEditData] = useState({
        title: task.title,
        description: task.description || '',
        trackerId: task.tracker.id,
        statusId: task.status.id,
        priorityId: task.priority.id,
        assigneeId: task.assignee?.id || '',
        versionId: task.version?.id || '',

        estimatedHours: task.estimatedHours?.toString() || '',
        doneRatio: task.doneRatio || 0,
        startDate: task.startDate
            ? (typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0])
            : '',
        dueDate: task.dueDate
            ? (typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : new Date(task.dueDate).toISOString().split('T')[0])
            : '',
    });

    const [newComment, setNewComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);
    const [showSubtaskModal, setShowSubtaskModal] = useState(false);

    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isDateDisabled = hasSubtasks && systemSettings?.parent_issue_dates === 'calculated';
    const isHoursDisabled = hasSubtasks && systemSettings?.parent_issue_estimated_hours === 'calculated';
    const isRatioDisabled = hasSubtasks && systemSettings?.parent_issue_done_ratio === 'calculated';

    const formatRelativeTime = (date: string | Date) => {
        const diffDays = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'hôm nay';
        if (diffDays === 1) return 'hôm qua';
        return `${diffDays} ngày trước`;
    };

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editData.title,
                    description: editData.description,
                    trackerId: editData.trackerId,
                    statusId: editData.statusId,
                    priorityId: editData.priorityId,
                    assigneeId: editData.assigneeId || null,
                    versionId: editData.versionId || null,

                    estimatedHours: editData.estimatedHours ? parseFloat(editData.estimatedHours) : null,
                    doneRatio: editData.doneRatio,
                    startDate: editData.startDate || null,
                    dueDate: editData.dueDate || null,
                }),
            });
            if (res.ok) {
                toast.success('Đã cập nhật công việc');
                setIsEditing(false);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
        setLoading(false);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setAddingComment(true);
        try {
            const res = await fetch(`/api/tasks/${task.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                setNewComment('');
                router.refresh();
            }
        } catch (err) {
            console.error(err);
        }
        setAddingComment(false);
    };

    return (
        <div className="space-y-6">
            {/* Top Info & Actions */}
            <div className="flex items-end justify-between pb-2">
                <div className="space-y-1.5">
                    {task.parent && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-400 font-medium">Công việc cha:</span>
                            <Link
                                href={`/tasks/${task.parent.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                                #{task.parent.number} {task.parent.title}
                            </Link>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Tạo bởi <span className="font-medium text-gray-600">{task.creator.name}</span> · {formatRelativeTime(task.createdAt)}</span>
                        {task.updatedAt !== task.createdAt && (
                            <span className="text-gray-300">| Cập nhật {formatRelativeTime(task.updatedAt)}</span>
                        )}
                    </div>
                </div>
                {canEdit && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                    </button>
                )}
            </div>

            {/* ========== KHỐI 1: THÔNG TIN ========== */}
            {isEditing ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800">Chỉnh sửa công việc</h3>
                        <button onClick={() => setIsEditing(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Tiêu đề</label>
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Mô tả</label>
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-none transition-all"
                                placeholder="Nhập mô tả công việc..."
                            />
                        </div>

                        {/* Main Properties Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Loại công việc</label>
                                <select
                                    value={editData.trackerId}
                                    onChange={(e) => setEditData({ ...editData, trackerId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                >
                                    {trackers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Trạng thái</label>
                                <select
                                    value={editData.statusId}
                                    onChange={(e) => setEditData({ ...editData, statusId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                >
                                    {allowedStatuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Độ ưu tiên</label>
                                <select
                                    value={editData.priorityId}
                                    onChange={(e) => setEditData({ ...editData, priorityId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                >
                                    {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Người thực hiện</label>
                                <select
                                    value={editData.assigneeId}
                                    onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Chưa gán</option>
                                    {task.project.members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Schedule & Progress */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Bắt đầu</label>
                                <input
                                    type="date"
                                    value={editData.startDate}
                                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    disabled={isDateDisabled}
                                    title={isDateDisabled ? "Tự động tính từ công việc con" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Kết thúc</label>
                                <input
                                    type="date"
                                    value={editData.dueDate}
                                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    disabled={isDateDisabled}
                                    title={isDateDisabled ? "Tự động tính từ công việc con" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Hoàn thành</label>
                                <select
                                    value={editData.doneRatio}
                                    onChange={(e) => setEditData({ ...editData, doneRatio: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    disabled={isRatioDisabled}
                                >
                                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => <option key={n} value={n}>{n}%</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Ước tính (h)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editData.estimatedHours}
                                    onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    disabled={isHoursDisabled}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Watchers & Attachments */}
                        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers.map(w => ({ userId: w.userId, user: w.user }))} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5">
                        {/* Description */}
                        {task.description && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Mô tả</h4>
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {task.description}
                                </div>
                            </div>
                        )}

                        {/* Properties - Compact 2 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-1">
                            <PropertyRow label="Trạng thái">
                                <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${task.status.isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {task.status.name}
                                </span>
                            </PropertyRow>

                            <PropertyRow label="Độ ưu tiên">
                                <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: task.priority.color || '#6b7280' }}>
                                    {task.priority.name}
                                </span>
                            </PropertyRow>

                            <PropertyRow label="Người thực hiện">
                                <span className={`text-sm font-medium ${task.assignee ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                    {task.assignee?.name || 'Chưa gán'}
                                </span>
                            </PropertyRow>

                            <PropertyRow label="Ngày bắt đầu">
                                <span className="text-sm text-gray-700 font-medium">{formatDate(task.startDate)}</span>
                            </PropertyRow>



                            <PropertyRow label="Hạn chót">
                                <span className="text-sm text-gray-700 font-medium">{formatDate(task.dueDate)}</span>
                            </PropertyRow>

                            {task.version && (
                                <PropertyRow label="Phiên bản">
                                    <span className="text-sm text-gray-900 font-medium">{task.version.name}</span>
                                </PropertyRow>
                            )}

                            <PropertyRow label="Hoàn thành">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 max-w-[140px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300" style={{ width: `${task.doneRatio}%` }} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 min-w-[38px]">{task.doneRatio}%</span>
                                </div>
                            </PropertyRow>

                            <PropertyRow label="Ước tính">
                                <span className="text-sm text-gray-700 font-medium">{task.estimatedHours ? `${task.estimatedHours} giờ` : '-'}</span>
                            </PropertyRow>
                        </div>

                        {/* Watchers & Attachments */}
                        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers.map(w => ({ userId: w.userId, user: w.user }))} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>
                </div>
            )}

            {/* ========== KHỐI 2: CÔNG VIỆC CON ========== */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-gray-800 text-sm">Công việc con</h4>
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{task.subtasks.length}</span>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => setShowSubtaskModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> Thêm mới
                        </button>
                    )}
                </div>

                {task.subtasks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 bg-gray-50 font-semibold">
                                    <th className="px-4 py-3 w-16 text-center">#</th>
                                    <th className="px-4 py-3 text-left">Tiêu đề</th>
                                    <th className="px-4 py-3 w-28 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 w-32">Người thực hiện</th>
                                    <th className="px-4 py-3 w-24 text-center">Bắt đầu</th>
                                    <th className="px-4 py-3 w-24 text-center">Kết thúc</th>
                                    <th className="px-4 py-3 w-20 text-center">%</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {task.subtasks.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-center font-medium">#{sub.number}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                                    {sub.tracker.name}
                                                </span>
                                                <Link
                                                    href={`/tasks/${sub.id}`}
                                                    className={`hover:text-blue-600 font-medium truncate max-w-[300px] transition-colors ${sub.status.isClosed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                                                >
                                                    {sub.title}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${sub.status.isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {sub.status.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-medium truncate max-w-[120px]">
                                            {sub.assignee?.name || <span className="text-gray-400 italic">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                                            {formatDate(sub.startDate)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                                            {formatDate(sub.dueDate)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-semibold text-gray-700">{sub.doneRatio || 0}%</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <TaskContextMenu
                                                taskId={sub.id}
                                                projectId={task.project.id}
                                                currentStatusId={sub.status.id}
                                                currentTrackerId={sub.tracker.id}
                                                currentPriorityId={sub.priority.id}
                                                currentAssigneeId={sub.assignee?.id || null}
                                                currentDoneRatio={sub.doneRatio || 0}
                                                statuses={statuses}
                                                trackers={trackers}
                                                priorities={priorities}
                                                onRefresh={() => router.refresh()}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">Chưa có công việc con</p>
                    </div>
                )}
            </div>

            {/* ========== KHỐI 3: BÌNH LUẬN ========== */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <h4 className="font-bold text-gray-800 text-sm">Bình luận</h4>
                        <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{task.comments.length}</span>
                    </div>
                </div>

                <div className="p-6">
                    {/* Comments List */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-5 pr-2">
                        {task.comments.map((c) => (
                            <div key={c.id} className={`flex gap-3 ${c.user.id === currentUserId ? 'flex-row-reverse' : ''}`}>
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs shrink-0 overflow-hidden font-bold text-white shadow-sm">
                                    {c.user.avatar ? (
                                        <Image src={c.user.avatar} alt={c.user.name} width={36} height={36} className="w-full h-full object-cover" />
                                    ) : (
                                        c.user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[75%] ${c.user.id === currentUserId ? 'items-end' : ''}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="font-semibold text-xs text-gray-700">{c.user.name}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${c.user.id === currentUserId ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {task.comments.length === 0 && (
                            <div className="text-center py-10">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm text-gray-400 font-medium">Chưa có bình luận nào</p>
                                <p className="text-xs text-gray-300 mt-1">Hãy là người đầu tiên bình luận</p>
                            </div>
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-3 items-end pt-4 border-t border-gray-100">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Nhập bình luận của bạn..."
                            rows={2}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none resize-none transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment();
                                }
                            }}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={addingComment || !newComment.trim()}
                            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Subtask Modal */}
            {showSubtaskModal && (
                <CreateTaskModal
                    isOpen={true}
                    projects={[{ id: task.project.id, name: task.project.name, identifier: task.project.identifier }]}
                    statuses={statuses}
                    priorities={priorities}
                    trackers={trackers}
                    versions={versions}
                    initialData={{ projectId: task.project.id, parentId: task.id, trackerId: task.tracker.id }}
                    onClose={() => setShowSubtaskModal(false)}
                    onSuccess={() => { setShowSubtaskModal(false); router.refresh(); }}
                />
            )}
        </div>
    );
}

// Helper: Property Row - Horizontal layout
function PropertyRow({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex items-center py-2.5 min-h-[40px] border-b border-gray-50 last:border-0">
            <span className="w-36 text-xs font-semibold text-gray-500 shrink-0">{label}</span>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}