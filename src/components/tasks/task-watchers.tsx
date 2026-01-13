'use client';

import { useState } from 'react';
import { Eye, EyeOff, UserPlus, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    avatar: string | null;
    email?: string;
}

interface Watcher {
    userId: string;
    user: User;
}

interface TaskWatchersProps {
    taskId: string;
    projectId: string; // Needed to search users in project
    initialWatchers: Watcher[];
    currentUserId: string;
    canManage: boolean; // Just simplified permission check
}

export function TaskWatchers({
    taskId,
    projectId,
    initialWatchers,
    currentUserId,
    canManage,
}: TaskWatchersProps) {
    const router = useRouter();
    const [watchers, setWatchers] = useState(initialWatchers);
    const [isWatching, setIsWatching] = useState(
        initialWatchers.some((w) => w.userId === currentUserId)
    );
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // For searching users to add
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);

    // Toggle watch myself
    const handleToggleWatch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/watch`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setIsWatching(data.data.watching);
                // Refresh watchers list locally or re-fetch
                if (data.data.watching) {
                    // Add myself mostly for UI feedback, realistic data usually needs full object
                    // Ideally we fetch updated list
                    fetchWatchers();
                } else {
                    setWatchers(watchers.filter(w => w.userId !== currentUserId));
                }
                router.refresh();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWatchers = async () => {
        const res = await fetch(`/api/tasks/${taskId}/watchers`);
        if (res.ok) {
            const data = await res.json();
            // API returns { watchers: [], isWatching: boolean }
            if (data.data?.watchers) {
                setWatchers(data.data.watchers);
                setIsWatching(data.data.isWatching);
            } else if (Array.isArray(data.data)) {
                setWatchers(data.data);
            }
        }
    };

    // Search users to add
    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // We reuse project members API or users API. 
            // Let's use project members API because we only want to add members
            const res = await fetch(`/api/projects/${projectId}/members`);
            if (res.ok) {
                const data = await res.json();
                // data.data is array of members { user: {...}, role: ... }
                // Filter client side for simplicity as API might not support search param yet or behaves differently
                const results = data.data
                    .map((m: any) => m.user)
                    .filter((u: User) =>
                        !watchers.some(w => w.userId === u.id) && // Not already watching
                        (u.name.toLowerCase().includes(query.toLowerCase()) ||
                            u.email?.toLowerCase().includes(query.toLowerCase()))
                    );
                setSearchResults(results);
            }
        } finally {
            setSearching(false);
        }
    };

    const handleAddWatcher = async (userId: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}/watchers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                fetchWatchers();
                setShowAddModal(false);
                setSearchQuery('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveWatcher = async (userId: string) => {
        if (!confirm('Xóa người theo dõi này?')) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}/watchers/${userId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setWatchers(watchers.filter(w => w.userId !== userId));
                if (userId === currentUserId) setIsWatching(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Người theo dõi ({watchers.length})
                </h4>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleToggleWatch}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isWatching
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                        }`}
                >
                    {isWatching ? <><EyeOff className="w-4 h-4" /> Bỏ theo dõi</> : <><Eye className="w-4 h-4" /> Theo dõi</>}
                </button>

                {canManage && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {Array.isArray(watchers) && watchers.map((watcher) => (
                    <div key={watcher.userId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                {watcher.user.avatar ? (
                                    <img src={watcher.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                                ) : (
                                    <span className="text-xs text-gray-600">
                                        {watcher.user.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[120px]" title={watcher.user.name}>
                                {watcher.user.name}
                            </span>
                        </div>
                        {canManage && (
                            <button
                                onClick={() => handleRemoveWatcher(watcher.userId)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
                {watchers.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">Chưa có người theo dõi</p>
                )}
            </div>

            {/* Add Watcher Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900">Thêm người theo dõi</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm thành viên..."
                                value={searchQuery}
                                onChange={(e) => handleSearchUsers(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {searchResults.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddWatcher(user.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                                >
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        {user.avatar ? <img src={user.avatar} className="w-8 h-8 rounded-full" /> : <span className="text-xs">{user.name.charAt(0)}</span>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </button>
                            ))}
                            {searchQuery.length >= 2 && searchResults.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy thành viên</p>
                            )}
                            {searchQuery.length < 2 && (
                                <p className="text-sm text-gray-500 text-center py-4">Nhập tên để tìm kiếm</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
