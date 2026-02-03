'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Pencil,
    X,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import { TaskWatchers } from '@/components/tasks/task-watchers';
import { TaskAttachments } from '@/components/tasks/task-attachments';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { LogTimeModal } from '@/components/tasks/log-time-modal';
import { taskService } from '@/services/task.service';
import { TaskComments } from '@/components/tasks/task-comments';
import { TaskSubtasks } from '@/components/tasks/task-subtasks';

import {
    TaskWithRelations as Task,
    Tracker,
    Status,
    Priority,
    SubtaskWithRelations as Subtask,
    Version,
    TimeLog
} from '@/types';

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
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });

    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [showLogTimeModal, setShowLogTimeModal] = useState(false);

    // Calculate subtask rollup for warning only
    let maxSubtaskDueDate: Date | null = null;
    if (task.subtasks && task.subtasks.length > 0) {
        for (const sub of task.subtasks) {
            if (sub.dueDate) {
                const d = new Date(sub.dueDate);
                if (!maxSubtaskDueDate || d > maxSubtaskDueDate) {
                    maxSubtaskDueDate = d;
                }
            }
        }
    }

    const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
    let overdueDays = 0;

    if (taskDueDate && maxSubtaskDueDate && maxSubtaskDueDate > taskDueDate) {
        const tDate = new Date(taskDueDate);
        tDate.setHours(0, 0, 0, 0);
        const sDate = new Date(maxSubtaskDueDate);
        sDate.setHours(0, 0, 0, 0);

        if (sDate > tDate) {
            const diffTime = Math.abs(sDate.getTime() - tDate.getTime());
            overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }

    const totalSpentTime = task.timeLogs?.reduce((sum, log) => sum + log.hours, 0) || 0;

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
            await taskService.update(task.id, {
                title: editData.title,
                description: editData.description,
                trackerId: editData.trackerId,
                statusId: editData.statusId,
                priorityId: editData.priorityId,
                assigneeId: editData.assigneeId || null,
                versionId: editData.versionId || null,

                estimatedHours: editData.estimatedHours ? (typeof editData.estimatedHours === 'string' ? parseFloat(editData.estimatedHours) : editData.estimatedHours) : null,
                doneRatio: editData.doneRatio,
                startDate: editData.startDate || null,
                dueDate: editData.dueDate || null,
            });
            toast.success('Đã cập nhật công việc');
            setIsEditing(false);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        }
        setLoading(false);
    };

    const isDateDisabled = false;
    const isHoursDisabled = false;
    const isRatioDisabled = false;

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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowLogTimeModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> Ghi thời gian
                        </button>
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                        </button>
                    </div>
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
                            {versions.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Phiên bản</label>
                                    <select
                                        value={editData.versionId}
                                        onChange={(e) => setEditData({ ...editData, versionId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Không chọn</option>
                                        {versions.filter(v => v.status === 'open' || v.id === task.version?.id).map((v) => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
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
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers?.map(w => ({ userId: w.userId, user: w.user })) || []} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments || []} canUpload={canEdit} currentUserId={currentUserId} />
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
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${overdueDays > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                        {formatDate(task.dueDate)}
                                    </span>
                                    {overdueDays > 0 && (
                                        <span className="text-[11px] text-red-600 font-bold flex items-center mt-1 animate-pulse">
                                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                            Trễ {overdueDays} ngày (do subtask)
                                        </span>
                                    )}
                                </div>
                            </PropertyRow>

                            <PropertyRow label="Phiên bản">
                                <span className={`text-sm font-medium ${task.version ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                    {task.version?.name || 'Chưa gán'}
                                </span>
                            </PropertyRow>

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

                            <PropertyRow label="Thực tế">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${totalSpentTime > (task.estimatedHours || 0) && task.estimatedHours ? 'text-orange-600' : 'text-blue-700'}`}>
                                        {totalSpentTime.toFixed(1)} giờ
                                    </span>
                                    {task.estimatedHours && totalSpentTime > 0 && (
                                        <span className="text-[10px] text-gray-400">
                                            ({Math.round((totalSpentTime / task.estimatedHours) * 100)}% dự kiến)
                                        </span>
                                    )}
                                </div>
                            </PropertyRow>
                        </div>

                        {/* Watchers & Attachments */}
                        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <TaskWatchers taskId={task.id} projectId={task.project.id} initialWatchers={task.watchers?.map(w => ({ userId: w.userId, user: w.user })) || []} currentUserId={currentUserId} canManage={canManageWatchers} />
                            <TaskAttachments taskId={task.id} initialAttachments={task.attachments || []} canUpload={canEdit} currentUserId={currentUserId} />
                        </div>
                    </div>
                </div>
            )}

            {/* ========== KHỐI 2: CÔNG VIỆC CON ========== */}
            <TaskSubtasks
                subtasks={task.subtasks || []}
                projectId={task.project.id}
                canEdit={canEdit}
                onAddSubtask={() => setShowSubtaskModal(true)}
                statuses={statuses}
                trackers={trackers}
                priorities={priorities}
            />

            {/* ========== KHỐI 4: BÌNH LUẬN ========== */}
            <TaskComments
                taskId={task.id}
                comments={task.comments || []}
                currentUserId={currentUserId}
            />

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

            <LogTimeModal
                isOpen={showLogTimeModal}
                onClose={() => setShowLogTimeModal(false)}
                taskId={task.id}
                projectId={task.project.id}
                onSuccess={() => router.refresh()}
            />
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