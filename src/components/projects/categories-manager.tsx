'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FolderOpen, User } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    assignedTo: { id: string; name: string; avatar: string | null } | null;
    _count: { tasks: number };
}

interface Member {
    userId: string;
    user: { id: string; name: string; avatar: string | null };
}

interface CategoriesManagerProps {
    projectId: string;
    initialCategories: Category[];
    members: Member[];
    canManage: boolean;
}

export function CategoriesManager({
    projectId,
    initialCategories,
    members,
    canManage,
}: CategoriesManagerProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', assignedToId: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/projects/${projectId}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    assignedToId: formData.assignedToId || null,
                }),
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({ name: '', assignedToId: '' });
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    assignedToId: formData.assignedToId || null,
                }),
            });

            if (res.ok) {
                setEditingId(null);
                setFormData({ name: '', assignedToId: '' });
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            if (!confirm(`Xóa category "${name}"? ${taskCount} công việc sẽ không còn category.`)) {
                return;
            }
        } else if (!confirm(`Bạn có chắc muốn xóa category "${name}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Đã xóa category');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            assignedToId: category.assignedTo?.id || '',
        });
        setError('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Phân loại công việc</h3>
                    <span className="text-sm text-gray-500">({categories.length})</span>
                </div>
                {canManage && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setFormData({ name: '', assignedToId: '' });
                            setError('');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm
                    </button>
                )}
            </div>

            {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="divide-y divide-gray-100">
                {isAdding && (
                    <div className="px-6 py-4 bg-blue-50">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Tên category"
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                autoFocus
                            />
                            <select
                                value={formData.assignedToId}
                                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Người phụ trách mặc định --</option>
                                {members.map((m) => (
                                    <option key={m.userId} value={m.userId}>
                                        {m.user.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !formData.name.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                Lưu
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {categories.map((category) => (
                    <div key={category.id} className="px-6 py-3 hover:bg-gray-50">
                        {editingId === category.id ? (
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                />
                                <select
                                    value={formData.assignedToId}
                                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="">-- Không có --</option>
                                    {members.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.user.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleUpdate(category.id)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                    Lưu
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{category.name}</span>
                                    {category.assignedTo && (
                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <User className="w-3 h-3" />
                                            {category.assignedTo.name}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        ({category._count.tasks} tasks)
                                    </span>
                                </div>
                                {canManage && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => startEdit(category)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id, category.name, category._count.tasks)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {categories.length === 0 && !isAdding && (
                    <div className="px-6 py-8 text-center text-gray-500">
                        Chưa có category nào.
                    </div>
                )}
            </div>
        </div>
    );
}
