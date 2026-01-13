'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

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
    dueDate?: string | Date | null;
}

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    trackers: Option[];
    statuses: Option[];
    priorities: Option[];
    versions?: Version[];
    initialData?: {
        projectId?: string;
        parentId?: string;
        trackerId?: string;
        statusId?: string;
        priorityId?: string;
        versionId?: string;
    };
    onSuccess?: () => void;
    allowedTrackerIdsByProject?: Record<string, string[]>;
}

export function CreateTaskModal({
    isOpen,
    onClose,
    projects,
    trackers,
    statuses,
    priorities,
    versions = [],
    initialData,
    onSuccess,
    allowedTrackerIdsByProject,
}: CreateTaskModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: initialData?.projectId || projects[0]?.id || '',
        trackerId: initialData?.trackerId || trackers[0]?.id || '',
        statusId: initialData?.statusId || statuses.find((s) => !s.isClosed)?.id || statuses[0]?.id || '',
        priorityId: initialData?.priorityId || priorities.find((p) => p.name === 'Normal')?.id || priorities[0]?.id || '',
        assigneeId: '',
        versionId: initialData?.versionId || '',
        estimatedHours: '',
        doneRatio: 0,
        startDate: '',
        dueDate: '',
        isPrivate: false,
        parentId: initialData?.parentId || null,
    });

    // Update form when initialData changes or modal opens
    // Members state
    const [members, setMembers] = useState<Array<{ user: { id: string; name: string } }>>([]);

    // Update form when initialData changes or modal opens
    useEffect(() => {
        if (isOpen) {
            const currentProjectId = initialData?.projectId || formData.projectId || projects[0]?.id || '';
            const allowedIds = allowedTrackerIdsByProject?.[currentProjectId];

            // Filter trackers based on project logic
            const availableTrackers = trackers.filter(t => !allowedIds || allowedIds.includes(t.id));

            // Determine best tracker ID:
            let bestTrackerId = '';
            if (initialData?.trackerId && availableTrackers.some(t => t.id === initialData.trackerId)) {
                bestTrackerId = initialData.trackerId;
            } else if (formData.trackerId && availableTrackers.some(t => t.id === formData.trackerId)) {
                bestTrackerId = formData.trackerId;
            } else if (availableTrackers.length > 0) {
                bestTrackerId = availableTrackers[0].id;
            }

            setFormData(prev => ({
                ...prev,
                projectId: currentProjectId,
                parentId: initialData?.parentId || null,
                trackerId: bestTrackerId,
            }));
            setError('');
        }
    }, [isOpen, initialData, projects, trackers, allowedTrackerIdsByProject, formData.projectId]);

    // Fetch members when project changes
    useEffect(() => {
        const fetchMembers = async () => {
            if (!formData.projectId || !isOpen) return;
            try {
                // Add timestamp to prevent caching
                const res = await fetch(`/api/projects/${formData.projectId}/members?assignable=true&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch members', err);
            }
        };
        fetchMembers();
    }, [formData.projectId, isOpen]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.projectId) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
                    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                    versionId: formData.versionId || null,
                    assigneeId: formData.assigneeId || null,
                }),
            });

            if (res.ok) {
                onClose();
                setFormData({
                    title: '',
                    description: '',
                    projectId: projects[0]?.id || '',
                    trackerId: trackers[0]?.id || '',
                    statusId: statuses.find((s) => !s.isClosed)?.id || statuses[0]?.id || '',
                    priorityId: priorities.find((p) => p.name === 'Normal')?.id || priorities[0]?.id || '',
                    assigneeId: '',
                    versionId: '',
                    estimatedHours: '',
                    doneRatio: 0,
                    startDate: '',
                    dueDate: '',
                    isPrivate: false,
                    parentId: null,
                });
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {formData.parentId ? 'Thêm công việc con' : 'Tạo công việc mới'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Project & Tracker */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dự án <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => {
                                    const newProjectId = e.target.value;
                                    // When project changes, update allowed tracker
                                    const allowedIds = allowedTrackerIdsByProject?.[newProjectId];
                                    const availableTrackers = trackers.filter(t => !allowedIds || allowedIds.includes(t.id));
                                    const newTrackerId = availableTrackers.length > 0 ? availableTrackers[0].id : '';

                                    setFormData({ ...formData, projectId: newProjectId, trackerId: newTrackerId, assigneeId: '' });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                disabled={!!initialData?.parentId} // Disable project selection if adding subtask
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tracker</label>
                            <select
                                value={formData.trackerId}
                                onChange={(e) => setFormData({ ...formData, trackerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                {trackers
                                    .filter(t => {
                                        if (!formData.projectId) return true;
                                        const allowed = allowedTrackerIdsByProject?.[formData.projectId];
                                        return !allowed || allowed.includes(t.id);
                                    })
                                    .map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Mô tả ngắn gọn công việc..."
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Chi tiết về công việc..."
                        />
                    </div>

                    {/* Status, Priority, Assignee */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={formData.statusId}
                                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                            <select
                                value={formData.priorityId}
                                onChange={(e) => setFormData({ ...formData, priorityId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                {priorities.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                            <select
                                value={formData.assigneeId}
                                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Chưa gán --</option>
                                {members.map((m) => (
                                    <option key={m.user.id} value={m.user.id}>
                                        {m.user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date & Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>

                    {/* Version & Estimated Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        {versions.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phiên bản</label>
                                <select
                                    value={formData.versionId}
                                    onChange={(e) => setFormData({ ...formData, versionId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="">-- Không chọn --</option>
                                    {versions.filter(v => v.status === 'open').map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ước tính (giờ)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.estimatedHours}
                                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>

                    {/* Done Ratio & Private */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                % Hoàn thành: {formData.doneRatio}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={formData.doneRatio}
                                onChange={(e) => setFormData({ ...formData, doneRatio: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">Riêng tư</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !formData.title.trim() || !formData.projectId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang tạo...' : (formData.parentId ? 'Thêm công việc con' : 'Tạo công việc')}
                    </button>
                </div>
            </div>
        </div>
    );
}
