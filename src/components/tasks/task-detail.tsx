'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    canFullEdit: boolean;
    canManageWatchers?: boolean;
    canAssignOthers?: boolean;
    currentUserId: string;
    allowedTrackerIds?: string[];
}

export function TaskDetail({
    task,
    trackers,
    statuses,
    priorities,
    allowedStatuses,
    versions = [],
    canEdit,
    canFullEdit,
    canManageWatchers = false,
    canAssignOthers = false,
    currentUserId,
    allowedTrackerIds,
}: TaskDetailProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === 'true' && canEdit);
    const [loading, setLoading] = useState(false);
    const [currentStatusId, setCurrentStatusId] = useState(task.status.id);

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

    // Giờ thực tế: cộng giờ của bản thân task + tất cả subtasks (Bottom-Up)
    const ownSpentTime = task.timeLogs?.reduce((sum, log) => sum + log.hours, 0) || 0;
    const subtaskSpentTime = task.subtasks?.reduce((sum, sub) => {
        return sum + (sub.timeLogs?.reduce((s, log) => s + log.hours, 0) || 0);
    }, 0) || 0;
    const totalSpentTime = ownSpentTime + subtaskSpentTime;
    const hasSubtaskTime = subtaskSpentTime > 0;

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
                assigneeId: editData.assigneeId || undefined,
                versionId: editData.versionId || undefined,
                estimatedHours: editData.estimatedHours ? (typeof editData.estimatedHours === 'string' ? parseFloat(editData.estimatedHours) : editData.estimatedHours) : null,
                doneRatio: editData.doneRatio,
                startDate: editData.startDate || null,
                dueDate: editData.dueDate || null,
            });
            setIsEditing(false);
            toast.success('Đã cập nhật công việc');
            router.refresh(); // Background sync để lấy data đầy đủ từ server
        } catch (err: any) {
            setIsEditing(true);
            toast.error(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    // Khoá các trường nhập liệu nếu có subtask (Vì áp dụng tính toán Bottom-Up - Cách 1)
    const hasSubtasks = (task.subtasks?.length || 0) > 0;
    const isDateDisabled = hasSubtasks;
    const isHoursDisabled = hasSubtasks;
    const isRatioDisabled = hasSubtasks;

    return (
        <div className="space-y-6">
            {/* Top Info & Actions */}
            <div className="flex items-end justify-between pb-2">
                <div className="space-y-1.5">
                    {task.parent && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-600 font-medium">Công việc cha:</span>
                            <Link
                                href={`/tasks/${task.parent.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                                #{task.parent.number} {task.parent.title}
                            </Link>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Tạo bởi <span className="font-medium text-gray-800">{task.creator.name}</span> · {formatRelativeTime(task.createdAt)}</span>
                        {task.updatedAt !== task.createdAt && (
                            <span className="text-gray-500">| Cập nhật {formatRelativeTime(task.updatedAt)}</span>
                        )}
                    </div>
                </div>
                {/* Action buttons - chỉ hiển thị khi có quyền (dù đầy đủ hay giới hạn) */}
                {canEdit && !isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowLogTimeModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Clock className="w-3.5 h-3.5" /> Ghi thời gian
                        </button>
                        {canFullEdit ? (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                            </button>
                        ) : (
                            // Chỉ có quyền edit_assigned: cho cập nhật trạng thái nhanh
                            <select
                                value={currentStatusId}
                                onChange={async (e) => {
                                    const newStatusId = e.target.value;
                                    const prevStatusId = currentStatusId;
                                    setCurrentStatusId(newStatusId); // optimistic update
                                    try {
                                        await taskService.update(task.id, { statusId: newStatusId });
                                        toast.success('Đã cập nhật trạng thái');
                                        router.refresh();
                                    } catch (err: any) {
                                        setCurrentStatusId(prevStatusId); // rollback đúng cách
                                        toast.error(err.message || 'Có lỗi xảy ra');
                                    }
                                }}
                                className="px-3 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg bg-white shadow-sm cursor-pointer"
                            >
                                {allowedStatuses.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
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
                                    {trackers
                                        .filter(t => !allowedTrackerIds || allowedTrackerIds.includes(t.id))
                                        .map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                            {!task.parent && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Người thực hiện</label>
                                    <select
                                        value={editData.assigneeId}
                                        onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Chưa gán</option>
                                        {(canAssignOthers
                                            ? task.project.members
                                            : task.project.members?.filter(m => m.user.id === currentUserId)
                                        )?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                                    </select>
                                </div>
                            )}
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
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Giờ dự kiến</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={editData.estimatedHours}
                                        onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                                        className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ví dụ: 8"
                                        disabled={isHoursDisabled}
                                        title={isHoursDisabled ? "Tự động tính từ tổng giờ công việc con" : ""}
                                    />
                                </div>
                            </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Description, Subtasks, Comments */}
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
                        {/* Description Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                <h4 className="text-sm font-bold text-gray-800">Mô tả</h4>
                            </div>
                            {task.description ? (
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    {task.description}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic py-2">Không có mô tả</p>
                            )}
                        </div>

                        {/* ========== KHỐI 2: CÔNG VIỆC CON ========== */}
                        {!task.parent && (
                            <TaskSubtasks
                                subtasks={task.subtasks || []}
                                projectId={task.project.id}
                                canEdit={canEdit}
                                onAddSubtask={() => setShowSubtaskModal(true)}
                                statuses={statuses}
                                trackers={trackers}
                                priorities={priorities}
                                canAssignOthers={canAssignOthers}
                                currentUserId={currentUserId}
                                allowedTrackerIds={trackers.map(t => t.id)}
                            />
                        )}

                        {/* ========== KHỐI 4: BÌNH LUẬN ========== */}
                        <TaskComments
                            taskId={task.id}
                            comments={task.comments || []}
                            currentUserId={currentUserId}
                        />
                    </div>

                    {/* Right Column: Properties, Watchers, Attachments */}
                    <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
                        {/* Task Properties Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Thuộc tính</h4>

                            <div className="flex flex-col">
                                <PropertyRow label="Trạng thái">
                                    <span className={`inline-flex px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${task.status.isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {task.status.name}
                                    </span>
                                </PropertyRow>

                                <PropertyRow label="Độ ưu tiên">
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.priority.color || '#6b7280' }}></div>
                                        <span className="text-xs font-bold text-gray-700" style={{ color: task.priority.color || '#6b7280' }}>
                                            {task.priority.name}
                                        </span>
                                    </div>
                                </PropertyRow>

                                {!task.parent && (
                                    <PropertyRow label="Người thực hiện">
                                        <div className="flex items-center justify-end gap-2 text-sm font-medium text-gray-900">
                                            {task.assignee ? (
                                                <>
                                                    {task.assignee.avatar ? (
                                                        <img src={task.assignee.avatar} alt={task.assignee.name} className="w-5 h-5 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                            {task.assignee.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span>{task.assignee.name}</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-500 italic text-xs">Chưa gán</span>
                                            )}
                                        </div>
                                    </PropertyRow>
                                )}

                                <PropertyRow label="Ngày bắt đầu">
                                    <span className="text-xs text-gray-700 font-semibold">{formatDate(task.startDate)}</span>
                                </PropertyRow>

                                <PropertyRow label="Hạn chót">
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-semibold ${overdueDays > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                            {formatDate(task.dueDate)} {overdueDays > 0 && '(Trễ)'}
                                        </span>
                                    </div>
                                </PropertyRow>

                                <PropertyRow label="Phiên bản">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded uppercase">{task.version?.name || 'Chưa gán'}</span>
                                    </div>
                                </PropertyRow>

                                {/* Progress Group */}
                                <div className="mt-5 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-600">Tiến độ</span>
                                        <span className="text-xs font-bold text-gray-900">{task.doneRatio || 0}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
                                        <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${task.doneRatio || 0}%` }} />
                                    </div>

                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1 bg-gray-50/80 rounded-xl p-3 text-center border border-gray-100">
                                            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Dự kiến</div>
                                            <div className="text-sm font-bold text-gray-800">{task.estimatedHours ? `${task.estimatedHours}h` : '-'}</div>
                                        </div>
                                        {/* Divider */}
                                        <div className="w-1 h-8 rounded-full bg-blue-100"></div>
                                        <div className="flex-1 bg-blue-50/50 rounded-xl p-3 text-center border border-blue-50">
                                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Thực tế</div>
                                            <div className="text-sm font-bold text-blue-700">{totalSpentTime.toFixed(1)}h</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Watchers & Attachments */}
                        <div className="flex flex-col gap-6">
                            {!task.parent && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                                    <TaskWatchers
                                        taskId={task.id}
                                        projectId={task.project.id}
                                        initialWatchers={task.watchers?.map(w => ({ userId: w.userId, user: w.user })) || []}
                                        currentUserId={currentUserId}
                                        canManage={canManageWatchers}
                                        creatorId={task.creator?.id}
                                        assigneeId={task.assignee?.id || undefined}
                                    />
                                </div>
                            )}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                                <TaskAttachments taskId={task.id} initialAttachments={task.attachments || []} canUpload={canEdit} currentUserId={currentUserId} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    canAssignOthers={canAssignOthers}
                    currentUserId={currentUserId}
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

// Helper: Property Row - Flex Between
function PropertyRow({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-2.5 min-h-[40px] border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 -mx-2 rounded transition-colors group">
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            <div className="text-right flex items-center justify-end">
                {children}
            </div>
        </div>
    );
}
