'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, GripVertical } from 'lucide-react';

interface Tracker {
    id: string;
    name: string;
    description: string | null;
    position: number;
    isDefault: boolean;
    _count: {
        tasks: number;
    };
}

interface TrackerListProps {
    trackers: Tracker[];
}

export function TrackerList({ trackers: initialTrackers }: TrackerListProps) {
    const router = useRouter();
    const [trackers, setTrackers] = useState(initialTrackers);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);

    // Create tracker
    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('/api/trackers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({ name: '', description: '' });
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    // Update tracker
    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/trackers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setEditingId(null);
                setFormData({ name: '', description: '' });
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    // Delete tracker
    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            alert(`Không thể xóa tracker "${name}" đang được sử dụng bởi ${taskCount} công việc`);
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa tracker "${name}"?`)) return;

        try {
            const res = await fetch(`/api/trackers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Set default
    const handleSetDefault = async (id: string) => {
        try {
            await fetch(`/api/trackers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    // Start editing
    const startEdit = (tracker: Tracker) => {
        setEditingId(tracker.id);
        setFormData({ name: tracker.name, description: tracker.description || '' });
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{trackers.length} trackers</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', description: '' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm tracker
                </button>
            </div>

            {/* Table */}
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="w-10"></th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số tasks</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mặc định</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Add new row */}
                    {isAdding && (
                        <tr className="border-b border-gray-200 bg-blue-50">
                            <td></td>
                            <td className="px-6 py-3">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Tên tracker"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                    autoFocus
                                />
                            </td>
                            <td className="px-6 py-3">
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả (tùy chọn)"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                />
                            </td>
                            <td></td>
                            <td></td>
                            <td className="px-6 py-3 text-right">
                                <button
                                    onClick={handleCreate}
                                    disabled={loading || !formData.name.trim()}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 mr-2"
                                >
                                    Lưu
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                            </td>
                        </tr>
                    )}

                    {/* Tracker rows */}
                    {trackers.map((tracker) => (
                        <tr key={tracker.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-2 text-gray-400 cursor-move">
                                <GripVertical className="w-4 h-4" />
                            </td>

                            {editingId === tracker.id ? (
                                <>
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                        />
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleUpdate(tracker.id)}
                                            disabled={loading}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 mr-2"
                                        >
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                        >
                                            Hủy
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-3">
                                        <span className="font-medium text-gray-900">{tracker.name}</span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{tracker.description || '-'}</td>
                                    <td className="px-6 py-3 text-center text-gray-500">{tracker._count.tasks}</td>
                                    <td className="px-6 py-3 text-center">
                                        {tracker.isDefault ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                                <Check className="w-3 h-3" />
                                                Mặc định
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(tracker.id)}
                                                className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                            >
                                                Đặt mặc định
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => startEdit(tracker)}
                                            className="p-1 text-gray-400 hover:text-blue-600 mr-1"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tracker.id, tracker.name, tracker._count.tasks)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}

                    {trackers.length === 0 && !isAdding && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                Chưa có tracker nào. Nhấn "Thêm tracker" để tạo mới.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
