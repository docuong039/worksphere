// global - used in: projects, tasks
﻿'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { taskService } from '@/api-client/task.service';
import { projectService } from '@/api-client/project.service';
import { PERMISSIONS } from '@/lib/constants';

interface Option {
    id: string;
    name: string;
    isClosed?: boolean;
    isDefault?: boolean;
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
    projectPermissionsMap?: Record<string, string[]>;
    canAssignOthers?: boolean;
    currentUserId?: string;
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
    projectPermissionsMap = {},
    canAssignOthers: defaultCanAssignOthers = false,
    currentUserId,
}: CreateTaskModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: initialData?.projectId || projects[0]?.id || '',
        trackerId: initialData?.trackerId || trackers[0]?.id || '',
        statusId: initialData?.statusId || statuses.find((s) => s.isDefault)?.id || statuses.find((s) => !s.isClosed)?.id || statuses[0]?.id || '',
        priorityId: initialData?.priorityId || priorities.find((p) => p.isDefault)?.id || priorities.find((p) => p.name === 'Bình thường' || p.name === 'Normal')?.id || priorities[0]?.id || '',
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

    // Track if we've initialized for the current open state
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setInitialized(false);
            return;
        }

        if (isOpen && !initialized) {
            const currentProjectId = initialData?.projectId || projects[0]?.id || '';
            const allowedIds = allowedTrackerIdsByProject?.[currentProjectId];
            const availableTrackers = trackers.filter(t => !allowedIds || allowedIds.includes(t.id));

            let bestTrackerId = '';
            if (initialData?.trackerId && availableTrackers.some(t => t.id === initialData.trackerId)) {
                bestTrackerId = initialData.trackerId;
            } else if (availableTrackers.length > 0) {
                bestTrackerId = availableTrackers[0].id;
            }

            setFormData(prev => ({
                ...prev,
                projectId: currentProjectId,
                parentId: initialData?.parentId || null,
                trackerId: bestTrackerId,
                statusId: initialData?.statusId || prev.statusId,
                priorityId: initialData?.priorityId || prev.priorityId,
                versionId: initialData?.versionId || prev.versionId,
            }));
            setInitialized(true);
            setError('');
        }
    }, [isOpen, initialized, initialData, projects, trackers, allowedTrackerIdsByProject]);

    // Fetch members and versions when project changes
    const [availableVersions, setAvailableVersions] = useState<Version[]>(versions);

    useEffect(() => {
        const fetchData = async () => {
            if (!formData.projectId || !isOpen) return;
            try {
                // Fetch members
                const memRes = await projectService.getMembers(formData.projectId, { assignable: 'true' });
                if (memRes.success) {
                    setMembers(memRes.data || []);
                }

                // Fetch versions
                const verRes = await projectService.getVersions(formData.projectId);
                if (verRes.success) {
                    setAvailableVersions(verRes.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch project data', err);
            }
        };
        fetchData();
    }, [formData.projectId, isOpen]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.projectId) return;
        // Bắt buộc phải chọn người thực hiện
        if (!formData.parentId && !formData.assigneeId) {
            setError('Vui lòng chọn người thực hiện cho công việc');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await taskService.create({
                ...formData,
                estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
                startDate: formData.startDate || undefined,
                dueDate: formData.dueDate || undefined,
                versionId: formData.versionId || undefined,
                assigneeId: formData.assigneeId,
                parentId: formData.parentId || undefined,
            });

            onClose();
            setFormData({
                title: '',
                description: '',
                projectId: projects[0]?.id || '',
                trackerId: trackers[0]?.id || '',
                statusId: statuses.find((s) => s.isDefault)?.id || statuses.find((s) => !s.isClosed)?.id || statuses[0]?.id || '',
                priorityId: priorities.find((p) => p.isDefault)?.id || priorities.find((p) => p.name === 'Bình thường' || p.name === 'Normal')?.id || priorities[0]?.id || '',
                assigneeId: '',
                versionId: '',
                estimatedHours: '',
                doneRatio: 0,
                startDate: '',
                dueDate: '',
                isPrivate: false,
                parentId: null,
            });
            // Gọi onSuccess ngay để refresh task list client-side
            if (onSuccess) onSuccess();
            // background sync từ server
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">
                        {formData.parentId ? 'Thêm công việc con' : 'Tạo công việc mới'}
                    </h2>
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

                    {/* Project & Tracker */}
                    <div className="grid gap-4 grid-cols-2">
                        {!formData.parentId && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Dự án <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => {
                                        const newProjectId = e.target.value;
                                        const allowedIds = allowedTrackerIdsByProject?.[newProjectId];
                                        const availableTrackers = trackers.filter(t => !allowedIds || allowedIds.includes(t.id));
                                        const newTrackerId = availableTrackers.length > 0 ? availableTrackers[0].id : '';
                                        setFormData({ ...formData, projectId: newProjectId, trackerId: newTrackerId, assigneeId: '' });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    disabled={!!initialData?.parentId}
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Loại công việc</label>
                            <select
                                value={formData.trackerId}
                                onChange={(e) => setFormData({ ...formData, trackerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            >
                                {trackers
                                    .filter(t => {
                                        if (!formData.projectId) return true;
                                        const allowed = allowedTrackerIdsByProject?.[formData.projectId];
                                        return !allowed || allowed.includes(t.id);
                                    })
                                    .map((t) => (
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
                            autoFocus
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

                    {/* Status, Priority, Assignee - 3 columns */}
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

                        {!formData.parentId && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Người thực hiện <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.assigneeId}
                                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${!formData.assigneeId ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                >
                                    <option value="">-- Chọn người thực hiện --</option>
                                    {members
                                        .filter(m => (
                                            defaultCanAssignOthers ||
                                            (formData.projectId && projectPermissionsMap[formData.projectId]?.includes(PERMISSIONS.TASKS.ASSIGN_OTHERS)) ||
                                            m.user.id === currentUserId
                                        ))
                                        .map((m) => (
                                            <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                        ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Date, Hours, Done Ratio - 4 columns */}
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
                <div className="px-5 py-4 bg-gray-50/80 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !formData.title.trim() || !formData.projectId || (!formData.parentId && !formData.assigneeId)}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Đang tạo...' : (formData.parentId ? 'Thêm công việc con' : 'Tạo công việc')}
                    </button>
                </div>
            </div>
        </div>
    );
}
