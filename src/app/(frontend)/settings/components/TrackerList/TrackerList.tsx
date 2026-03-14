'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, GripVertical } from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import { trackerService } from '@/api-client/tracker.service';

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
    const { confirm } = useConfirm();
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
            const response = await trackerService.create(formData);
            // Chỉ đóng form và reset khi API thành công
            setIsAdding(false);
            setFormData({ name: '', description: '' });
            toast.success('Đã tạo tracker mới');

            // Optimistic: thêm tracker vào state ngay từ response
            if (response.data) {
                setTrackers((prev) => [...prev, { ...response.data!, _count: { tasks: 0 } }]);
            }
            router.refresh(); // Background sync
        } catch (error) {
            console.error(error);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
            // Form vẫn mở, dữ liệu nhập vẫn còn
        } finally {
            setLoading(false);
        }
    };


    // Update tracker
    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);

        // Optimistic: cập nhật ngay
        const previous = trackers;
        setTrackers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, name: formData.name, description: formData.description || null } : t))
        );
        setEditingId(null);
        setFormData({ name: '', description: '' });

        try {
            await trackerService.update(id, formData);
            router.refresh(); // Background sync
        } catch (error) {
            setTrackers(previous); // Rollback
            console.error(error);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Delete tracker
    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            toast.error(`Không thể xóa tracker "${name}" đang được sử dụng bởi ${taskCount} công việc`);
            return;
        }

        confirm({
            title: 'Xóa tracker',
            description: `Bạn có chắc muốn xóa tracker "${name}"? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay
                const previous = trackers;
                setTrackers((prev) => prev.filter((t) => t.id !== id));
                toast.success('Đã xóa tracker');

                try {
                    await trackerService.delete(id);
                    router.refresh(); // Background sync
                } catch (err: any) {
                    setTrackers(previous); // Rollback
                    toast.error(err.message || 'Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
                }
            },
        });
    };


    // Set default
    const handleSetDefault = async (id: string) => {
        // Optimistic: toggle default ngay
        const previous = trackers;
        setTrackers((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));
        try {
            await trackerService.setDefault(id);
            router.refresh(); // Background sync
        } catch (error) {
            setTrackers(previous); // Rollback
            console.error(error);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
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
                    Thêm loại công việc
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
                                Chưa có tracker nào. Nhấn &quot;Thêm tracker&quot; để tạo mới.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
