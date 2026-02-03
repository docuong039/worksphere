'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, GripVertical, Lock } from 'lucide-react';
import { statusService } from '@/services/status.service';

interface Status {
    id: string;
    name: string;
    description: string | null;
    position: number;
    isClosed: boolean;
    isDefault: boolean;
    defaultDoneRatio: number | null;
    _count: {
        tasks: number;
    };
}

interface StatusListProps {
    statuses: Status[];
}

export function StatusList({ statuses: initialStatuses }: StatusListProps) {
    const router = useRouter();
    const [statuses] = useState(initialStatuses);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isClosed: false,
        defaultDoneRatio: null as number | null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Create status
    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            await statusService.create(formData);
            setIsAdding(false);
            setFormData({ name: '', description: '', isClosed: false, defaultDoneRatio: null });
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    // Update status
    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            await statusService.update(id, formData);
            setEditingId(null);
            setFormData({ name: '', description: '', isClosed: false, defaultDoneRatio: null });
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    // Delete status
    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            toast.error(`Không thể xóa status "${name}" đang được sử dụng bởi ${taskCount} công việc`);
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa status "${name}"?`)) return;

        try {
            await statusService.delete(id);
            toast.success('Đã xóa status');
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        }
    };

    // Set default
    const handleSetDefault = async (id: string) => {
        try {
            await statusService.setDefault(id);
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error('Có lỗi xảy ra');
        }
    };

    // Start editing
    const startEdit = (status: Status) => {
        setEditingId(status.id);
        setFormData({
            name: status.name,
            description: status.description || '',
            isClosed: status.isClosed,
            defaultDoneRatio: status.defaultDoneRatio,
        });
        setError('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{statuses.length} statuses</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', description: '', isClosed: false, defaultDoneRatio: null });
                        setError('');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm status
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Đã đóng</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">% Mặc định</th>
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
                                    placeholder="Tên status"
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
                            <td className="px-6 py-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isClosed}
                                    onChange={(e) => setFormData({ ...formData, isClosed: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={formData.defaultDoneRatio ?? ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        defaultDoneRatio: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                    placeholder="0-100"
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                                />
                            </td>
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

                    {/* Status rows */}
                    {statuses.map((status) => (
                        <tr key={status.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-2 text-gray-400 cursor-move">
                                <GripVertical className="w-4 h-4" />
                            </td>

                            {editingId === status.id ? (
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
                                    <td className="px-6 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isClosed}
                                            onChange={(e) => setFormData({ ...formData, isClosed: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="10"
                                            value={formData.defaultDoneRatio ?? ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                defaultDoneRatio: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                            placeholder="0-100"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                                        />
                                    </td>
                                    <td></td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleUpdate(status.id)}
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
                                        <span className="font-medium text-gray-900">{status.name}</span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{status.description || '-'}</td>
                                    <td className="px-6 py-3 text-center">
                                        {status.isClosed ? (
                                            <span className="inline-flex items-center gap-1 text-orange-600">
                                                <Lock className="w-4 h-4" />
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {status.defaultDoneRatio !== null ? (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                                {status.defaultDoneRatio}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-500">{status._count.tasks}</td>
                                    <td className="px-6 py-3 text-center">
                                        {status.isDefault ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                                <Check className="w-3 h-3" />
                                                Mặc định
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(status.id)}
                                                className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                            >
                                                Đặt mặc định
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => startEdit(status)}
                                            className="p-1 text-gray-400 hover:text-blue-600 mr-1"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(status.id, status.name, status._count.tasks)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}

                    {statuses.length === 0 && !isAdding && (
                        <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                Chưa có status nào. Nhấn &quot;Thêm status&quot; để tạo mới.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Legend */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    <Lock className="w-3 h-3 inline mr-1" />
                    <strong>Đã đóng (isClosed)</strong>: Status đánh dấu công việc đã hoàn thành (ví dụ: Closed, Rejected)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    <strong>% Mặc định</strong>: Khi chuyển sang status này, % hoàn thành sẽ tự động được đặt thành giá trị này (VD: Closed = 100%)
                </p>
            </div>
        </div>
    );
}
