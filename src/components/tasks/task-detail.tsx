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
    category: { id: string; name: string } | null;
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
        categoryId: task.category?.id || '',
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
                    categoryId: editData.categoryId || null,
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
        <div className="space-y-4 text-sm">
            {/* Top Info & Actions */}
            <div className="flex items-end justify-between pb-3">
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

            {/* Content Area: Switch between Edit and View detail */}
            {isEditing ? (
                <div className="bg-white rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80">
                        <h3 className="text-sm font-semibold text-gray-800">Chỉnh sửa công việc</h3>
                        <button onClick={() => setIsEditing(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-5 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tiêu đề</label>
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Mô tả</label>
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-colors"
                                placeholder="Nhập mô tả công việc..."
                            />
                        </div>

                        {/* Main Properties - 2 columns */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Loại công việc</label>
                                <select
                                    value={editData.trackerId}
                                    onChange={(e) => setEditData({ ...editData, trackerId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    {trackers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Trạng thái</label>
                                <select
                                    value={editData.statusId}
                                    onChange={(e) => setEditData({ ...editData, statusId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    {allowedStatuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Độ ưu tiên</label>
                                <select
                                    value={editData.priorityId}
                                    onChange={(e) => setEditData({ ...editData, priorityId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Người thực hiện</label>
                                <select
                                    value={editData.assigneeId}
                                    onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Chưa gán</option>
                                    {task.project.members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Schedule & Progress - 4 columns */}
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Bắt đầu</label>
                                <input
                                    type="date"
                                    value={editData.startDate}
                                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    disabled={isDateDisabled}
                                    title={isDateDisabled ? "Tự động tính từ công việc con" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kết thúc</label>
                                <input
                                    type="date"
                                    value={editData.dueDate}
                                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    disabled={isDateDisabled}
                                    title={isDateDisabled ? "Tự động tính từ công việc con" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Hoàn thành</label>
                                <select
                                    value={editData.doneRatio}
                                    onChange={(e) => setEditData({ ...editData, doneRatio: parseInt(e.target.value) })}
                                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    disabled={isRatioDisabled}
                                >
                                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => <option key={n} value={n}>{n}%</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ước tính (giờ)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editData.estimatedHours}
                                    onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    disabled={isHoursDisabled}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Watchers & Attachments */}
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers.map(w => ({ userId: w.userId, user: w.user }))} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 py-4 bg-gray-50/80 flex justify-end gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleSave} disabled={loading} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            ) : (
                /* View Detail Section */
                <div className="bg-white rounded-lg overflow-hidden">
                    <div className="p-5 space-y-5">
                        {/* Description Section */}
                        {task.description && (
                            <div>
                                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Mô tả</h4>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-3 rounded-lg">
                                    {task.description}
                                </div>
                            </div>
                        )}

                        {/* Properties Grid - Clean & Scannable */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                            {/* Column 1 */}
                            <div>
                                <PropertyItem label="Trạng thái">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${task.status.isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {task.status.name}
                                    </span>
                                </PropertyItem>
                                <PropertyItem label="Độ ưu tiên">
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: task.priority.color || '#6b7280' }}>
                                        {task.priority.name}
                                    </span>
                                </PropertyItem>
                                <PropertyItem label="Người thực hiện">
                                    <span className={`text-sm font-medium ${task.assignee ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {task.assignee?.name || 'Chưa gán'}
                                    </span>
                                </PropertyItem>
                                {task.category && (
                                    <PropertyItem label="Phân loại">
                                        <span className="text-gray-900 text-sm font-medium">{task.category.name}</span>
                                    </PropertyItem>
                                )}
                                {task.version && (
                                    <PropertyItem label="Phiên bản">
                                        <span className="text-gray-900 text-sm font-medium">{task.version.name}</span>
                                    </PropertyItem>
                                )}
                            </div>

                            {/* Column 2 */}
                            <div>
                                <PropertyItem label="Ngày bắt đầu">
                                    <span className="text-gray-900 text-sm font-medium">{formatDate(task.startDate)}</span>
                                </PropertyItem>
                                <PropertyItem label="Hạn chót">
                                    <span className="text-gray-900 text-sm font-medium">{formatDate(task.dueDate)}</span>
                                </PropertyItem>
                                <PropertyItem label="Hoàn thành">
                                    <div className="flex items-center gap-2 w-full max-w-[160px]">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${task.doneRatio}%` }} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 w-10 text-right">{task.doneRatio}%</span>
                                    </div>
                                </PropertyItem>
                                <PropertyItem label="Ước tính">
                                    <span className="text-gray-900 text-sm font-medium">{task.estimatedHours ? `${task.estimatedHours}h` : '-'}</span>
                                </PropertyItem>
                            </div>
                        </div>

                        {/* Watchers & Attachments in View Mode */}
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers.map(w => ({ userId: w.userId, user: w.user }))} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>
                </div>
            )}

            {/* Subtasks */}
            <div className="bg-white rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80">
                    <h4 className="font-semibold text-gray-700 text-xs flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        Công việc con
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{task.subtasks.length}</span>
                    </h4>
                    {canEdit && (
                        <button
                            onClick={() => setShowSubtaskModal(true)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Thêm
                        </button>
                    )}
                </div>

                {task.subtasks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] text-gray-400 bg-gray-50/50 uppercase font-semibold tracking-wider">
                                    <th className="px-3 py-2 w-14 text-center">#</th>
                                    <th className="px-3 py-2 text-left">Tiêu đề</th>
                                    <th className="px-3 py-2 w-24 text-center">Trạng thái</th>
                                    <th className="px-3 py-2 w-28">Người thực hiện</th>
                                    <th className="px-3 py-2 w-20 text-center">Bắt đầu</th>
                                    <th className="px-3 py-2 w-20 text-center">Kết thúc</th>
                                    <th className="px-3 py-2 w-16 text-right">%</th>
                                    <th className="px-3 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {task.subtasks.map((sub, index) => (
                                    <tr key={sub.id} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                        <td className="px-3 py-2 text-gray-400 text-center text-xs">#{sub.number}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] uppercase font-medium text-gray-400 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                                                    {sub.tracker.name}
                                                </span>
                                                <Link
                                                    href={`/tasks/${sub.id}`}
                                                    className={`hover:text-blue-600 font-medium text-sm truncate max-w-[280px] ${sub.status.isClosed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                                                >
                                                    {sub.title}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${sub.status.isClosed
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {sub.status.name}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 text-sm truncate max-w-[100px]">
                                            {sub.assignee?.name || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-500 text-xs">
                                            {formatDate(sub.startDate)}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-500 text-xs">
                                            {formatDate(sub.dueDate)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <span className="text-xs font-medium text-gray-600">{sub.doneRatio || 0}%</span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
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
                    <div className="text-center py-6">
                        <GitBranch className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                        <p className="text-gray-400 text-xs">Chưa có công việc con</p>
                    </div>
                )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg overflow-hidden">
                <div className="bg-gray-50/80 px-4 py-3">
                    <h4 className="font-semibold text-gray-700 text-xs flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        Bình luận
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{task.comments.length}</span>
                    </h4>
                </div>
                <div className="p-4">
                    <div className="space-y-3 max-h-[350px] overflow-y-auto mb-3 pr-1">
                        {task.comments.map((c) => (
                            <div key={c.id} className={`flex gap-2.5 ${c.user.id === currentUserId ? 'flex-row-reverse' : ''}`}>
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] shrink-0 overflow-hidden font-semibold text-gray-500">
                                    {c.user.avatar ? <Image src={c.user.avatar} alt={c.user.name} width={28} height={28} className="w-full h-full object-cover" /> : c.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={`flex flex-col max-w-[80%] ${c.user.id === currentUserId ? 'items-end' : ''}`}>
                                    <div className="flex items-center gap-2 mb-0.5 px-1">
                                        <span className="font-medium text-[10px] text-gray-500">{c.user.name}</span>
                                        <span className="text-[9px] text-gray-400">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-xl text-sm ${c.user.id === currentUserId ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-700 rounded-tl-sm'}`}>
                                        <p className="whitespace-pre-wrap">{c.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {task.comments.length === 0 && (
                            <div className="text-center py-6">
                                <MessageSquare className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                                <p className="text-xs text-gray-400">Chưa có bình luận</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 items-end pt-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết bình luận..."
                            rows={1}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
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
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-4 h-4" />
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

// Helper: Property Item with label and value alignment
function PropertyItem({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex items-center py-2 min-h-[38px]">
            <span className="w-1/3 text-xs font-medium text-gray-500 shrink-0">{label}</span>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
