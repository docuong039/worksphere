'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Filter, Save, Trash2, Globe, Lock } from 'lucide-react';

interface Query {
    id: string;
    name: string;
    isPublic: boolean;
    filters: string;
    columns: string | null;
    sortBy: string | null;
    sortOrder: string | null;
    groupBy: string | null;
    user: { id: string; name: string };
    project: { id: string; name: string; identifier: string } | null;
}

interface SavedQueriesListProps {
    queries: Query[];
    currentUserId: string;
    onSelectQuery: (query: Query) => void;
}

export function SavedQueriesList({
    queries: initialQueries,
    currentUserId,
    onSelectQuery,
}: SavedQueriesListProps) {
    const router = useRouter();
    const [queries, setQueries] = useState(initialQueries);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa bộ lọc "${name}"?`)) return;

        try {
            const res = await fetch(`/api/queries/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setQueries((prev) => prev.filter((q) => q.id !== id));
                toast.success('Đã xóa bộ lọc');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    const publicQueries = queries.filter((q) => q.isPublic);
    const myQueries = queries.filter((q) => !q.isPublic && q.user.id === currentUserId);

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900 text-sm">Bộ lọc đã lưu</h4>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {/* Public Queries */}
                {publicQueries.length > 0 && (
                    <div className="p-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Công khai
                        </p>
                        <div className="space-y-1">
                            {publicQueries.map((query) => (
                                <div
                                    key={query.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer group"
                                    onClick={() => onSelectQuery(query)}
                                >
                                    <span className="text-sm text-gray-700">{query.name}</span>
                                    {query.user.id === currentUserId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(query.id, query.name);
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Queries */}
                {myQueries.length > 0 && (
                    <div className="p-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Của tôi
                        </p>
                        <div className="space-y-1">
                            {myQueries.map((query) => (
                                <div
                                    key={query.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer group"
                                    onClick={() => onSelectQuery(query)}
                                >
                                    <span className="text-sm text-gray-700">{query.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(query.id, query.name);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {queries.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Chưa có bộ lọc nào.
                    </div>
                )}
            </div>
        </div>
    );
}

interface SaveQueryModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Record<string, unknown>;
    columns?: string[];
    sortBy?: string;
    sortOrder?: string;
    groupBy?: string;
    projectId?: string;
}

export function SaveQueryModal({
    isOpen,
    onClose,
    filters,
    columns,
    sortBy,
    sortOrder,
    groupBy,
    projectId,
}: SaveQueryModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Vui lòng nhập tên bộ lọc');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/queries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    projectId,
                    isPublic,
                    filters,
                    columns,
                    sortBy,
                    sortOrder,
                    groupBy,
                }),
            });

            if (res.ok) {
                toast.success('Đã lưu bộ lọc');
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Save className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">Lưu bộ lọc</h3>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên bộ lọc *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Việc của tôi chưa xong"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            autoFocus
                        />
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                            Công khai (mọi người có thể sử dụng)
                        </span>
                    </label>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu bộ lọc'}
                    </button>
                </div>
            </div>
        </div>
    );
}
