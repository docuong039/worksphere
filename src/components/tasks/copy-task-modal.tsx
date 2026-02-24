'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Option {
    id: string;
    name: string;
    isClosed?: boolean;
}

interface Project {
    id: string;
    name: string;
    identifier: string;
}

interface Version {
    id: string;
    name: string;
    status: string;
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

interface CopyTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: TaskData;
    projects: Project[];
    trackers: Option[];
    statuses: Option[];
    priorities: Option[];
}

export function CopyTaskModal({
    isOpen,
    onClose,
    taskData,
    projects,
    trackers,
    statuses,
    priorities,
}: CopyTaskModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatDateForInput = (date: string | Date | null) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        title: taskData.title,
        description: taskData.description || '',
        projectId: taskData.projectId,
        trackerId: taskData.trackerId,
        statusId: taskData.statusId,
        priorityId: taskData.priorityId,
        assigneeId: taskData.assigneeId || '',
        versionId: taskData.versionId || '',
        estimatedHours: taskData.estimatedHours?.toString() || '',
        doneRatio: taskData.doneRatio || 0,
        startDate: formatDateForInput(taskData.startDate),
        dueDate: formatDateForInput(taskData.dueDate),
        isPrivate: taskData.isPrivate,
    });

    const [copySubtasks, setCopySubtasks] = useState(true);
    const [members, setMembers] = useState<Array<{ user: { id: string; name: string } }>>([]);
    const [availableVersions, setAvailableVersions] = useState<Version[]>([]);

    // Reset form when modal opens with new task data
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: taskData.title,
                description: taskData.description || '',
                projectId: taskData.projectId,
                trackerId: taskData.trackerId,
                statusId: taskData.statusId,
                priorityId: taskData.priorityId,
                assigneeId: taskData.assigneeId || '',
                versionId: taskData.versionId || '',
                estimatedHours: taskData.estimatedHours?.toString() || '',
                doneRatio: taskData.doneRatio || 0,
                startDate: formatDateForInput(taskData.startDate),
                dueDate: formatDateForInput(taskData.dueDate),
                isPrivate: taskData.isPrivate,
            });
            setCopySubtasks(true);
            setError('');
        }
    }, [isOpen, taskData]);

    // Fetch members and versions when project changes
    useEffect(() => {
        const fetchData = async () => {
            if (!formData.projectId || !isOpen) return;
            try {
                const memRes = await fetch(`/api/projects/${formData.projectId}/members?assignable=true`);
                if (memRes.ok) {
                    const data = await memRes.json();
                    setMembers(data.data || []);
                }

                const verRes = await fetch(`/api/projects/${formData.projectId}/versions`);
                if (verRes.ok) {
                    const data = await verRes.json();
                    setAvailableVersions(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch project data', err);
            }
        };
        fetchData();
    }, [formData.projectId, isOpen]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        if (!formData.title.trim() || !formData.projectId) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/tasks/${taskData.id}/copy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetProjectId: formData.projectId !== taskData.projectId ? formData.projectId : undefined,
                    copySubtasks: taskData.hasSubtasks ? copySubtasks : false,
                    // Override task data
                    title: formData.title,
                    description: formData.description,
                    trackerId: formData.trackerId,
                    statusId: formData.statusId,
                    priorityId: formData.priorityId,
                    assigneeId: formData.assigneeId || null,
                    versionId: formData.versionId || null,
                    estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
                    doneRatio: formData.doneRatio,
                    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                    isPrivate: formData.isPrivate,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Đã sao chép công việc thành công');
                onClose();
                router.push(`/tasks/${data.id}`);
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            setError('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Copy className="w-5 h-5 text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-900">Sao chép công việc</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Copy Subtasks Option */}
                    {taskData.hasSubtasks && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={copySubtasks}
                                    onChange={(e) => setCopySubtasks(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-blue-800">Sao chép cả công việc con</span>
                            </label>
                        </div>
                    )}

                    {/* Project & Tracker */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Dự án <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, assigneeId: '', versionId: '' })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Loại công việc</label>
                            <select
                                value={formData.trackerId}
                                onChange={(e) => setFormData({ ...formData, trackerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                {trackers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="Mô tả ngắn gọn công việc..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                            placeholder="Chi tiết về công việc..."
                        />
                    </div>

                    {/* Status, Priority, Assignee */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Trạng thái</label>
                            <select
                                value={formData.statusId}
                                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Độ ưu tiên</label>
                            <select
                                value={formData.priorityId}
                                onChange={(e) => setFormData({ ...formData, priorityId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                {priorities.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Người thực hiện</label>
                            <select
                                value={formData.assigneeId}
                                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                <option value="">Chưa gán</option>
                                {members.map((m) => (
                                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date, Hours, Done Ratio */}
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Bắt đầu</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Kết thúc</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Ước tính (giờ)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.estimatedHours}
                                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Hoàn thành</label>
                            <select
                                value={formData.doneRatio}
                                onChange={(e) => setFormData({ ...formData, doneRatio: parseInt(e.target.value) })}
                                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => (
                                    <option key={n} value={n}>{n}%</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Version & Private */}
                    <div className="flex items-end gap-4">
                        {availableVersions.length > 0 && (
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Phiên bản</label>
                                <select
                                    value={formData.versionId}
                                    onChange={(e) => setFormData({ ...formData, versionId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Không chọn</option>
                                    {availableVersions.filter(v => v.status === 'open').map((v) => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center h-[38px]">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Riêng tư</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-gray-50/80 flex justify-end gap-3 shrink-0 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={loading || !formData.title.trim() || !formData.projectId}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        {loading ? 'Đang sao chép...' : 'Sao chép'}
                    </button>
                </div>
            </div>
        </div>
    );
}
