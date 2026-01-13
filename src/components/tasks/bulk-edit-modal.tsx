'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit2, AlertTriangle } from 'lucide-react';

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTaskIds: string[];
    projectId: string;
    trackers: { id: string; name: string }[];
    statuses: { id: string; name: string }[];
    priorities: { id: string; name: string }[];
    versions: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    members: { userId: string; user: { id: string; name: string } }[];
}

export function BulkEditModal({
    isOpen,
    onClose,
    selectedTaskIds,
    projectId,
    trackers,
    statuses,
    priorities,
    versions,
    categories,
    members,
}: BulkEditModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [updates, setUpdates] = useState<Record<string, string | number | boolean | null>>({});

    if (!isOpen) return null;

    const handleFieldChange = (field: string, value: string | number | boolean | null) => {
        setUpdates((prev) => {
            if (value === '' || value === undefined) {
                const { [field]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSubmit = async () => {
        if (Object.keys(updates).length === 0) {
            setError('Vui lòng chọn ít nhất một thay đổi');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/tasks/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskIds: selectedTaskIds,
                    updates,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Đã cập nhật ${data.updatedCount}/${data.requestedCount} công việc`);
                onClose();
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">
                            Sửa nhiều công việc ({selectedTaskIds.length})
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            Chỉ những trường được chọn mới được cập nhật. Để trống để giữ nguyên giá trị hiện tại.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tracker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tracker
                            </label>
                            <select
                                value={(updates.trackerId as string) || ''}
                                onChange={(e) => handleFieldChange('trackerId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                {trackers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={(updates.statusId as string) || ''}
                                onChange={(e) => handleFieldChange('statusId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Độ ưu tiên
                            </label>
                            <select
                                value={(updates.priorityId as string) || ''}
                                onChange={(e) => handleFieldChange('priorityId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                {priorities.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Người phụ trách
                            </label>
                            <select
                                value={(updates.assigneeId as string) ?? ''}
                                onChange={(e) =>
                                    handleFieldChange(
                                        'assigneeId',
                                        e.target.value === 'null' ? null : e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                <option value="null">Bỏ người phụ trách</option>
                                {members.map((m) => (
                                    <option key={m.userId} value={m.userId}>
                                        {m.user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Version */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phiên bản
                            </label>
                            <select
                                value={(updates.versionId as string) ?? ''}
                                onChange={(e) =>
                                    handleFieldChange(
                                        'versionId',
                                        e.target.value === 'null' ? null : e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                <option value="null">Bỏ phiên bản</option>
                                {versions.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phân loại
                            </label>
                            <select
                                value={(updates.categoryId as string) ?? ''}
                                onChange={(e) =>
                                    handleFieldChange(
                                        'categoryId',
                                        e.target.value === 'null' ? null : e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                <option value="null">Bỏ phân loại</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Done Ratio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                % Hoàn thành
                            </label>
                            <select
                                value={(updates.doneRatio as number)?.toString() || ''}
                                onChange={(e) =>
                                    handleFieldChange(
                                        'doneRatio',
                                        e.target.value ? parseInt(e.target.value) : ''
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
                                    <option key={v} value={v}>
                                        {v}%
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Private */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Riêng tư
                            </label>
                            <select
                                value={
                                    updates.isPrivate === undefined
                                        ? ''
                                        : updates.isPrivate
                                            ? 'true'
                                            : 'false'
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        'isPrivate',
                                        e.target.value === '' ? '' : e.target.value === 'true'
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Không thay đổi --</option>
                                <option value="false">Công khai</option>
                                <option value="true">Riêng tư</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày bắt đầu
                            </label>
                            <input
                                type="date"
                                value={(updates.startDate as string) || ''}
                                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày hết hạn
                            </label>
                            <input
                                type="date"
                                value={(updates.dueDate as string) || ''}
                                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {Object.keys(updates).length} trường sẽ được cập nhật
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || Object.keys(updates).length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
