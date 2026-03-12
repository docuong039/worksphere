'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, GripVertical } from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import { priorityService } from '@/api-client/priority.service';

interface Priority {
    id: string;
    name: string;
    position: number;
    color: string | null;
    isDefault: boolean;
    _count: {
        tasks: number;
    };
}

interface PriorityListProps {
    priorities: Priority[];
}

// Preset colors
const COLORS = [
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
];

export function PriorityList({ priorities: initialPriorities }: PriorityListProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [priorities, setPriorities] = useState(initialPriorities);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#3b82f6',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Create priority
    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            const response = await priorityService.create(formData);
            // Chỉ đóng form khi API thành công
            setIsAdding(false);
            setFormData({ name: '', color: '#3b82f6' });
            toast.success('Đã tạo priority mới');

            // Optimistic: thêm priority vào state ngay từ response
            if (response.data) {
                setPriorities((prev) => [...prev, { ...response.data!, _count: { tasks: 0 } }]);
            }
            router.refresh(); // Background sync
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
            // Form vẫn mở, user có thể sửa và thử lại
        } finally {
            setLoading(false);
        }
    };


    // Update priority
    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        // Optimistic: cập nhật ngay
        const previous = priorities;
        setPriorities((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name: formData.name, color: formData.color } : p))
        );
        setEditingId(null);
        setFormData({ name: '', color: '#3b82f6' });

        try {
            await priorityService.update(id, formData);
            router.refresh(); // Background sync
        } catch (err: any) {
            setPriorities(previous); // Rollback
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    // Delete priority
    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            toast.error(`Không thể xóa priority "${name}" đang được sử dụng bởi ${taskCount} công việc`);
            return;
        }

        confirm({
            title: 'Xóa mức độ ưu tiên',
            description: `Bạn có chắc muốn xóa mức độ ưu tiên "${name}"? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay
                const previous = priorities;
                setPriorities((prev) => prev.filter((p) => p.id !== id));
                toast.success('Đã xóa priority');

                try {
                    await priorityService.delete(id);
                    router.refresh(); // Background sync
                } catch (err: any) {
                    setPriorities(previous); // Rollback
                    toast.error(err.message || 'Có lỗi xảy ra');
                }
            },
        });
    };


    // Set default
    const handleSetDefault = async (id: string) => {
        // Optimistic: toggle default ngay
        const previous = priorities;
        setPriorities((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
        try {
            await priorityService.setDefault(id);
            router.refresh(); // Background sync
        } catch (err) {
            setPriorities(previous); // Rollback
            console.error(err);
            toast.error('Có lỗi xảy ra');
        }
    };

    // Start editing
    const startEdit = (priority: Priority) => {
        setEditingId(priority.id);
        setFormData({
            name: priority.name,
            color: priority.color || '#3b82f6',
        });
        setError('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{priorities.length} priorities</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', color: '#3b82f6' });
                        setError('');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm độ ưu tiên
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="w-10"></th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Màu sắc</th>
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
                                    placeholder="Tên priority"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                    autoFocus
                                />
                            </td>
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => setFormData({ ...formData, color: c.value })}
                                            className={`w-6 h-6 rounded-full border-2 ${formData.color === c.value ? 'border-gray-900' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
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

                    {/* Priority rows */}
                    {priorities.map((priority) => (
                        <tr key={priority.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-2 text-gray-400 cursor-move">
                                <GripVertical className="w-4 h-4" />
                            </td>

                            {editingId === priority.id ? (
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
                                        <div className="flex items-center gap-2">
                                            {COLORS.map((c) => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setFormData({ ...formData, color: c.value })}
                                                    className={`w-6 h-6 rounded-full border-2 ${formData.color === c.value ? 'border-gray-900' : 'border-transparent'
                                                        }`}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleUpdate(priority.id)}
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
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: priority.color || '#6b7280' }}
                                            />
                                            <span className="font-medium text-gray-900">{priority.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span
                                            className="inline-block px-2 py-1 rounded text-xs text-white"
                                            style={{ backgroundColor: priority.color || '#6b7280' }}
                                        >
                                            {priority.color || '#6b7280'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-500">{priority._count.tasks}</td>
                                    <td className="px-6 py-3 text-center">
                                        {priority.isDefault ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                                <Check className="w-3 h-3" />
                                                Mặc định
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(priority.id)}
                                                className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                            >
                                                Đặt mặc định
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => startEdit(priority)}
                                            className="p-1 text-gray-400 hover:text-blue-600 mr-1"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(priority.id, priority.name, priority._count.tasks)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}

                    {priorities.length === 0 && !isAdding && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                Chưa có priority nào. Nhấn &quot;Thêm priority&quot; để tạo mới.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
