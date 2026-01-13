'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface Category {
    id: string;
    name: string;
}

interface Activity {
    id: string;
    name: string;
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
    categories?: Category[];
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
    categories = [],
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
                setIsEditing(false);
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error(err);
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
            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
                <div className="space-y-2">
                    {task.parent && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-400 font-bold uppercase tracking-tight">Cha:</span>
                            <Link
                                href={`/tasks/${task.parent.id}`}
                                className="text-blue-600 hover:text-blue-800 font-bold hover:underline underline-offset-2"
                            >
                                #{task.parent.number} {task.parent.title}
                            </Link>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Tạo bởi <span className="font-bold text-gray-600">{task.creator.name}</span> <span className="italic">{formatRelativeTime(task.createdAt)}</span></span>
                        {task.updatedAt !== task.createdAt && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-200" />
                                <span>Cập nhật <span className="italic">{formatRelativeTime(task.updatedAt)}</span></span>
                            </>
                        )}
                    </div>
                </div>
                {canEdit && !isEditing && (
                    <div className="flex gap-2 mb-0.5">
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                            <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area: Switch between Edit and View detail */}
            {isEditing ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Chỉnh sửa công việc</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Tiêu đề</label>
                                <input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Mô tả</label>
                                <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Tracker</label>
                                <select value={editData.trackerId} onChange={(e) => setEditData({ ...editData, trackerId: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                                    {trackers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Trạng thái</label>
                                <select value={editData.statusId} onChange={(e) => setEditData({ ...editData, statusId: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                                    {allowedStatuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Độ ưu tiên</label>
                                <select value={editData.priorityId} onChange={(e) => setEditData({ ...editData, priorityId: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                                    {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Người thực hiện</label>
                                <select value={editData.assigneeId} onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                                    <option value="">-- Chưa gán --</option>
                                    {task.project.members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Bắt đầu</label>
                                <input type="date" value={editData.startDate} onChange={(e) => setEditData({ ...editData, startDate: e.target.value })} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-400" disabled={isDateDisabled} title={isDateDisabled ? "Tự động tính từ công việc con" : ""} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Kết thúc</label>
                                <input type="date" value={editData.dueDate} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-400" disabled={isDateDisabled} title={isDateDisabled ? "Tự động tính từ công việc con" : ""} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">% Hoàn thành</label>
                                <select value={editData.doneRatio} onChange={(e) => setEditData({ ...editData, doneRatio: parseInt(e.target.value) })} className="w-full px-2 py-1.5 border rounded text-xs bg-white disabled:bg-gray-50 disabled:text-gray-400" disabled={isRatioDisabled}>
                                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => <option key={n} value={n}>{n}%</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-0.5">Ước tính (h)</label>
                                <input type="number" step="0.5" value={editData.estimatedHours} onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-400" disabled={isHoursDisabled} />
                            </div>
                        </div>

                        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers.map(w => ({ userId: w.userId, user: w.user }))} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 font-semibold hover:text-gray-800">Hủy</button>
                        <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded shadow-sm hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            ) : (
                /* View Detail Section */
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 space-y-6">
                        {/* Description Section */}
                        <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</h4>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-gray-50/30 p-3 rounded border border-gray-100 italic">
                                {task.description || "Chưa có mô tả..."}
                            </div>
                        </div>

                        {/* Properties Grid - Organized & Scannable */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 pt-2 border-t border-gray-100">
                            {/* Column 1 */}
                            <div className="divide-y divide-gray-50">
                                <PropertyItem label="Trạng thái">
                                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${task.status.isClosed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {task.status.name}
                                    </span>
                                </PropertyItem>
                                <PropertyItem label="Độ ưu tiên">
                                    <span className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm" style={{ backgroundColor: task.priority.color || '#6b7280' }}>
                                        {task.priority.name}
                                    </span>
                                </PropertyItem>
                                <PropertyItem label="Người thực hiện">
                                    <span className={`text-sm font-bold ${task.assignee ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                        {task.assignee?.name || 'Chưa gán'}
                                    </span>
                                </PropertyItem>
                                {task.category && (
                                    <PropertyItem label="Phân loại">
                                        <span className="text-gray-900 text-sm font-bold">{task.category.name}</span>
                                    </PropertyItem>
                                )}
                                {task.version && (
                                    <PropertyItem label="Phiên bản">
                                        <span className="text-gray-900 text-sm font-bold">{task.version.name}</span>
                                    </PropertyItem>
                                )}
                            </div>

                            {/* Column 2 */}
                            <div className="divide-y divide-gray-100">
                                <PropertyItem label="Ngày bắt đầu">
                                    <span className="text-gray-900 text-sm font-bold">{formatDate(task.startDate)}</span>
                                </PropertyItem>
                                <PropertyItem label="Hạn chót">
                                    <span className="text-gray-900 text-sm font-bold">{formatDate(task.dueDate)}</span>
                                </PropertyItem>
                                <PropertyItem label="% Hoàn thành">
                                    <div className="flex items-center gap-3 w-full max-w-[180px]">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${task.doneRatio}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 w-10 text-right">{task.doneRatio}%</span>
                                    </div>
                                </PropertyItem>
                                <PropertyItem label="Dự kiến">
                                    <span className="text-gray-900 text-sm font-bold">{task.estimatedHours ? `${task.estimatedHours}h` : '-'}</span>
                                </PropertyItem>
                            </div>
                        </div>

                        {/* Watchers & Attachments in View Mode */}
                        <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers.map(w => ({ userId: w.userId, user: w.user }))} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>
                </div>
            )}

            {/* Subtasks */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        Công việc con
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{task.subtasks.length}</span>
                    </h4>
                    {canEdit && (
                        <button
                            onClick={() => setShowSubtaskModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> Thêm mới
                        </button>
                    )}
                </div>

                {task.subtasks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-gray-400 border-b bg-gray-50/50 uppercase font-bold tracking-widest">
                                    <th className="px-3 py-2 w-16 text-center">#</th>
                                    <th className="px-3 py-2">Tiêu đề công việc</th>
                                    <th className="px-3 py-2 w-28 text-center">Trạng thái</th>
                                    <th className="px-3 py-2 w-32">Người thực hiện</th>
                                    <th className="px-3 py-2 w-24 text-center">Bắt đầu</th>
                                    <th className="px-3 py-2 w-24 text-center">Kết thúc</th>
                                    <th className="px-3 py-2 w-24 text-right">%</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {task.subtasks.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-3 py-2.5 text-gray-400 text-center font-mono">#{sub.number}</td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                                                    {sub.tracker.name}
                                                </span>
                                                <Link
                                                    href={`/tasks/${sub.id}`}
                                                    className={`hover:text-blue-600 font-medium truncate max-w-[300px] ${sub.status.isClosed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                                                >
                                                    {sub.title}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${sub.status.isClosed
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                {sub.status.name}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-600 truncate max-w-[120px]">
                                            {sub.assignee?.name || '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-gray-500 whitespace-nowrap">
                                            {formatDate(sub.startDate)}
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-gray-500 whitespace-nowrap">
                                            {formatDate(sub.dueDate)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                                    <div
                                                        className={`h-full ${(sub.doneRatio || 0) >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${sub.doneRatio || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs w-8">{sub.doneRatio || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
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
                    <div className="text-center py-8 bg-gray-50/30">
                        <GitBranch className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                        <p className="text-gray-400 text-sm">Chưa có công việc con nào được gán.</p>
                    </div>
                )}
            </div>

            {/* Comments: Chat-like Interface */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        Bình luận ({task.comments.length})
                    </h4>
                </div>
                <div className="p-4 bg-gray-50/10">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-200 pr-2">
                        {task.comments.map((c) => (
                            <div key={c.id} className={`flex gap-3 ${c.user.id === currentUserId ? 'flex-row-reverse' : ''}`}>
                                <div className="w-7 h-7 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center text-[10px] shrink-0 overflow-hidden font-bold text-gray-500">
                                    {c.user.avatar ? <img src={c.user.avatar} className="w-full h-full object-cover" /> : c.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={`flex flex-col max-w-[85%] ${c.user.id === currentUserId ? 'items-end' : ''}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="font-bold text-[10px] text-gray-500">{c.user.name}</span>
                                        <span className="text-[9px] text-gray-400">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-2xl text-[13px] shadow-sm ${c.user.id === currentUserId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {task.comments.length === 0 && (
                            <div className="text-center py-8 opacity-40">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-[11px] italic">Chưa có bình luận nào.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 items-end pt-3 border-t border-gray-100">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết phản hồi..."
                            rows={1}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
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
                            className="p-2.5 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 transition-all"
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
        <div className="flex items-center py-2.5 min-h-[45px]">
            <span className="w-1/3 text-sm font-bold text-gray-500 shrink-0">{label}</span>
            <div className="flex-1 pl-2">
                {children}
            </div>
        </div>
    );
}
