'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, UserPlus, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/providers/confirm-provider';

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
    canManage: boolean;
    creatorId?: string;
    assigneeId?: string;
}

export function TaskWatchers({
    taskId,
    projectId,
    initialWatchers,
    currentUserId,
    canManage,
    creatorId,
    assigneeId,
}: TaskWatchersProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [watchers, setWatchers] = useState(initialWatchers);
    const [isWatching, setIsWatching] = useState(
        initialWatchers.some((w) => w.userId === currentUserId)
    );
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Sync state with props
    useEffect(() => {
        setWatchers(initialWatchers);
    }, [initialWatchers]);


    // For searching users to add
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);

    // Toggle watch myself
    const handleToggleWatch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/watch`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setIsWatching(data.data.watching);
                if (data.data.watching) {
                    fetchWatchers(); // Refresh để lấy object đầy đủ
                } else {
                    setWatchers((prev) => prev.filter((w) => w.userId !== currentUserId));
                }
                // Không cần router.refresh() - state đã cập nhật
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

        try {
            // We reuse project members API or users API. 
            // Let's use project members API because we only want to add members
            const res = await fetch(`/api/projects/${projectId}/members`);
            if (res.ok) {
                const data = await res.json();
                // data.data is array of members { user: {...}, role: ... }
                interface MemberData { user: User }
                const results = data.data
                    .map((m: MemberData) => m.user)
                    .filter((u: User) =>
                        !watchers.some(w => w.userId === u.id) && // Not already watching
                        (u.name.toLowerCase().includes(query.toLowerCase()) ||
                            u.email?.toLowerCase().includes(query.toLowerCase()))
                    );
                setSearchResults(results);
            }
        } catch {
            // Silently handle search error
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
        confirm({
            title: 'Xóa người theo dõi',
            description: 'Bạn có chắc muốn xóa người theo dõi này khỏi công việc?',
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/tasks/${taskId}/watchers/${userId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        setWatchers(watchers.filter(w => w.userId !== userId));
                        if (userId === currentUserId) setIsWatching(false);
                    }
                } catch (err) {
            toast.error('Không thể xóa dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
                    console.error(err);
                }
            }
        });
    };


    return (
        <div className="bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    Theo dõi ({watchers.length})
                </h4>
                {canManage && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Thêm
                    </button>
                )}
            </div>

            {/* Toggle Watch Myself - Only if NOT creator/assignee */}
            {currentUserId !== creatorId && currentUserId !== assigneeId && (
                <div className="mb-4">
                    <button
                        onClick={handleToggleWatch}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm border ${isWatching
                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200'
                            : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                            }`}
                    >
                        {isWatching ? (
                            <><EyeOff className="w-4 h-4" /> Bỏ theo dõi</>
                        ) : (
                            <><Eye className="w-4 h-4" /> Theo dõi công việc này</>
                        )}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2">
                {Array.isArray(watchers) && watchers.map((watcher) => (
                    <div
                        key={watcher.userId}
                        className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-gray-100 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100/50 rounded-lg flex items-center justify-center shrink-0 border border-blue-100/50">
                                {watcher.user.avatar ? (
                                    <Image src={watcher.user.avatar} alt={watcher.user.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-blue-600">
                                        {watcher.user.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <span className="text-sm font-semibold text-gray-800 block truncate" title={watcher.user.name}>
                                    {watcher.user.name}
                                </span>
                                {watcher.user.id === currentUserId && (
                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Bạn</span>
                                )}
                            </div>
                        </div>
                        {canManage && (
                            <button
                                onClick={() => handleRemoveWatcher(watcher.userId)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Xóa người theo dõi"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
                {watchers.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-[13px] italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        Chưa có người theo dõi
                    </div>
                )}
            </div>

            {/* Add Watcher Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-blue-600" />
                                Thêm người theo dõi
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên hoặc email thành viên..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleAddWatcher(user.id)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 hover:shadow-sm rounded-xl text-left border border-transparent hover:border-blue-100 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-blue-100/50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/50">
                                            {user.avatar ? (
                                                <Image src={user.avatar} alt={user.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-blue-600">{user.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate">{user.name}</p>
                                            <p className="text-[11px] text-gray-500 font-medium truncate italic">{user.email}</p>
                                        </div>
                                        <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))}
                                {searchQuery.length >= 2 && searchResults.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                            <Search className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium italic">Không tìm thấy thành viên</p>
                                    </div>
                                )}
                                {searchQuery.length < 2 && (
                                    <div className="text-center py-12 text-gray-400">
                                        <p className="text-sm italic font-medium">Nhập tối thiểu 2 ký tự để tìm kiếm</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Chỉ thành viên trong dự án mới có thể theo dõi</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
