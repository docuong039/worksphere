'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, CheckSquare, Folder, User, Filter } from 'lucide-react';

interface ActivityItem {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    changes: any;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
    entityDetails?: {
        id: string;
        name?: string;
        title?: string;
        number?: number;
        project?: { id: string; name: string };
    };
}

export default function ActivityPage() {
    const searchParams = useSearchParams();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState({
        task: true,
        project: true,
        user: true,
    });

    const userId = searchParams.get('userId');

    useEffect(() => {
        setPage(1);
        setActivities([]);
        setHasMore(true);
    }, [selectedTypes, userId]);

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();
                query.set('page', page.toString());
                query.set('limit', '50');
                if (userId) query.set('userId', userId);

                const activeTypes = Object.entries(selectedTypes)
                    .filter(([_, active]) => active)
                    .map(([type]) => type);

                if (activeTypes.length === 0) {
                    setActivities([]);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }

                const res = await fetch(`/api/activity?${query.toString()}`);
                const data = await res.json();

                if (data.success) {
                    const filtered = data.data.activities.filter((a: ActivityItem) =>
                        activeTypes.includes(a.entityType)
                    );
                    if (page === 1) {
                        setActivities(filtered);
                    } else {
                        setActivities(prev => [...prev, ...filtered]);
                    }
                    setHasMore(data.data.activities.length >= 50);
                }
            } catch (error) {
                console.error('Failed to fetch activity:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [page, userId, selectedTypes]);

    // Nhóm theo ngày
    const grouped = activities.reduce((acc, act) => {
        const date = new Date(act.createdAt).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(act);
        return acc;
    }, {} as Record<string, ActivityItem[]>);

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <CheckSquare className="w-4 h-4 text-blue-500" />;
            case 'project': return <Folder className="w-4 h-4 text-indigo-500" />;
            case 'user': return <User className="w-4 h-4 text-green-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatAction = (act: ActivityItem) => {
        let actionText = '';
        let targetLink = null;

        // Hàm map action sang tiếng Việt
        const getActionText = (action: string, entityType: string) => {
            const actionLower = action.toLowerCase();
            switch (actionLower) {
                case 'created': return entityType === 'task' ? 'đã tạo công việc' : 'đã tạo';
                case 'updated': return 'đã cập nhật';
                case 'deleted': return 'đã xóa';
                case 'archived': return 'đã lưu trữ';
                case 'unarchived': return 'đã hủy lưu trữ';
                case 'commented': return 'đã bình luận vào';
                case 'logged_time': return 'đã ghi nhận thời gian cho';
                default: return `đã ${actionLower}`;
            }
        };

        if (act.entityType === 'task' && act.entityDetails) {
            const task = act.entityDetails;
            targetLink = (
                <Link href={`/tasks/${task.id}`} className="font-medium text-blue-600 hover:underline">
                    {task.project?.name} - #{task.number}: {task.title}
                </Link>
            );
            actionText = getActionText(act.action, 'task');
        } else if (act.entityType === 'project' && act.entityDetails) {
            const project = act.entityDetails;
            targetLink = (
                <Link href={`/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">
                    {project.name}
                </Link>
            );
            actionText = getActionText(act.action, 'project') + ' dự án';
        } else if (act.entityType === 'project' && !act.entityDetails) {
            // Trường hợp dự án đã bị xóa, không còn entityDetails
            const projectName = act.changes?.old?.name || act.changes?.new?.name || 'Dự án';
            targetLink = <span className="font-medium text-gray-500">{projectName}</span>;
            actionText = getActionText(act.action, 'project') + ' dự án';
        } else {
            actionText = getActionText(act.action, act.entityType) + ` ${act.entityType}`;
        }

        return (
            <div className="text-sm text-gray-700">
                <div className="flex items-center gap-2 flex-wrap">
                    {getIcon(act.entityType)}
                    <span className="text-xs text-gray-400">
                        {new Date(act.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-gray-900">{act.user.name}</span>
                    <span>{actionText}</span>
                    {targetLink}
                </div>
                {act.changes && (act.action.toLowerCase() === 'updated' || act.action === 'updated') && act.changes.old && act.changes.new && (
                    <div className="mt-2 ml-6 text-xs text-gray-500 space-y-1">
                        {Object.keys(act.changes.new).map((key: string) => {
                            const oldValue = act.changes.old?.[key];
                            const newValue = act.changes.new?.[key];
                            // Chỉ hiển thị nếu có thay đổi thực sự
                            if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return null;
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">{key}:</span>
                                    {oldValue !== undefined && (
                                        <span className="line-through text-gray-400">{String(oldValue ?? '-')}</span>
                                    )}
                                    <span className="text-blue-600">→ {String(newValue ?? '-')}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b">Hoạt động</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-gray-50 py-2 border-b">
                                {date}
                            </h3>
                            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                                {items.map((act) => (
                                    <div key={act.id} className="relative pl-4">
                                        <div className="absolute -left-[9px] top-2 w-2.5 h-2.5 bg-white border-2 border-gray-300 rounded-full"></div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
                                            {formatAction(act)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    )}

                    {!loading && activities.length === 0 && (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p>Không tìm thấy hoạt động nào.</p>
                        </div>
                    )}

                    {hasMore && !loading && activities.length > 0 && (
                        <div className="text-center">
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Xem thêm
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Filters */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm sticky top-4">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Bộ lọc
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-blue-600">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.task}
                                    onChange={e => setSelectedTypes(prev => ({ ...prev, task: e.target.checked }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Công việc
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-blue-600">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.project}
                                    onChange={e => setSelectedTypes(prev => ({ ...prev, project: e.target.checked }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Dự án
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-blue-600">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.user}
                                    onChange={e => setSelectedTypes(prev => ({ ...prev, user: e.target.checked }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Thành viên
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
