'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    Clock,
    Filter,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    Pencil,
    Trash2,
    MoreHorizontal,
    Calendar,
    User,
    Briefcase,
    FileText,
    X,
    Activity,
    MessageSquare,
    Loader2,
} from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import { LogTimeModal } from '@/components/tasks/log-time-modal';

interface TimeLog {
    id: string;
    hours: number;
    spentOn: string;
    comments: string | null;
    createdAt: string;
    user: { id: string; name: string; avatar: string | null };
    activity: { id: string; name: string };
    task: { id: string; number: number; title: string } | null;
    project: { id: string; name: string; identifier: string };
}

interface Project {
    id: string;
    name: string;
    identifier: string;
}

interface ActivityOption {
    id: string;
    name: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface SpentTimeContentProps {
    initialProjectId?: string;
    initialTaskId?: string;
    hideHeader?: boolean;
    titleSize?: 'sm' | 'md' | 'lg';
}

export function SpentTimeContent({
    initialProjectId = '',
    initialTaskId = '',
    hideHeader = false,
    titleSize = 'lg',
}: SpentTimeContentProps) {
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(true);
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activities, setActivities] = useState<ActivityOption[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    // Filters
    const [projectId, setProjectId] = useState(initialProjectId);
    const [taskId, setTaskId] = useState(initialTaskId);
    const [userId, setUserId] = useState('');
    const [activityId, setActivityId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalHours, setTotalHours] = useState(0);

    // Modal
    const [showLogTimeModal, setShowLogTimeModal] = useState(false);
    const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

    // Action menu
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const fetchFilters = async () => {
        try {
            const [projectsRes, activitiesRes, usersRes] = await Promise.all([
                fetch('/api/projects?limit=100'),
                fetch('/api/time-entry-activities'),
                fetch('/api/users?limit=100'),
            ]);

            if (projectsRes.ok) {
                const data = await projectsRes.json();
                setProjects(data.data?.projects || data.data || []);
            }
            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.data || []);
            }
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.data?.users || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchTimeLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (projectId) params.append('projectId', projectId);
            if (taskId) params.append('taskId', taskId);
            if (userId) params.append('userId', userId);
            if (activityId) params.append('activityId', activityId);
            if (fromDate) params.append('from', fromDate);
            if (toDate) params.append('to', toDate);
            params.append('page', page.toString());
            params.append('limit', '25');

            const res = await fetch(`/api/spent-time?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTimeLogs(data.data.timeLogs || []);
                setTotalPages(data.data.pagination?.totalPages || 1);
                setTotalHours(data.data.totalHours || 0);
            }
        } catch (error) {
            console.error('Error fetching time logs:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId, taskId, userId, activityId, fromDate, toDate, page]);

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchTimeLogs();
    }, [fetchTimeLogs]);

    const handleDelete = async (logId: string) => {
        confirm({
            title: 'Xóa bản ghi thời gian',
            description: 'Bạn có chắc muốn xóa bản ghi thời gian này? Thao tác này không thể hoàn tác.',
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay và cập nhật tổng giờ
                const deletedLog = timeLogs.find((l) => l.id === logId);
                setTimeLogs((prev) => prev.filter((l) => l.id !== logId));
                if (deletedLog) setTotalHours((h) => Math.max(0, h - deletedLog.hours));
                setOpenMenuId(null);
                toast.success('Đã xóa bản ghi thời gian');

                try {
                    const res = await fetch(`/api/spent-time/${logId}`, { method: 'DELETE' });
                    if (!res.ok) {
                        const data = await res.json();
                        toast.error(data.error || 'Có lỗi xảy ra');
                        fetchTimeLogs(); // Rollback - tải lại từ server
                    }
                } catch {
                    toast.error('Lỗi kết nối máy chủ');
                    fetchTimeLogs(); // Rollback
                }
            }
        });
    };


    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleExportCSV = () => {
        const params = new URLSearchParams();
        if (projectId) params.append('projectId', projectId);
        if (taskId) params.append('taskId', taskId);
        if (userId) params.append('userId', userId);
        if (activityId) params.append('activityId', activityId);
        if (fromDate) params.append('from', fromDate);
        if (toDate) params.append('to', toDate);
        params.append('format', 'csv');

        window.open(`/api/spent-time/export?${params.toString()}`, '_blank');
    };

    // Group time logs by date
    const groupedLogs = timeLogs.reduce((acc, log) => {
        const date = log.spentOn.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {} as Record<string, TimeLog[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`${titleSize === 'lg' ? 'text-2xl' : titleSize === 'md' ? 'text-xl' : 'text-lg'} font-bold text-gray-900`}>
                            Thời gian
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Theo dõi thời gian thực tế đã thực hiện
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Xuất CSV
                        </button>
                        <button
                            onClick={() => setShowLogTimeModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            Ghi thời gian
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                        <Filter className="w-4 h-4 text-blue-600" />
                        Bộ lọc tìm kiếm
                    </div>
                    {(projectId !== initialProjectId || userId || activityId || fromDate || toDate) && (
                        <button
                            onClick={() => {
                                setProjectId(initialProjectId);
                                setTaskId(initialTaskId);
                                setUserId('');
                                setActivityId('');
                                setFromDate('');
                                setToDate('');
                                setPage(1);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                            Xóa tất cả
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {!initialProjectId && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Dự án</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={projectId}
                                    onChange={(e) => {
                                        setProjectId(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">Tất cả dự án</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Người thực hiện</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={userId}
                                onChange={(e) => {
                                    setUserId(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Tất cả thành viên</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Hoạt động</label>
                        <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={activityId}
                                onChange={(e) => {
                                    setActivityId(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Tất cả hoạt động</option>
                                {activities.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Từ ngày</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Đến ngày</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                        Tổng cộng: <span className="font-bold">{totalHours.toFixed(1)} giờ</span>
                    </span>
                </div>
                {timeLogs.length > 0 && (
                    <span className="text-sm text-gray-500 font-medium">
                        Hiển thị {timeLogs.length} bản ghi trong trang này
                    </span>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : timeLogs.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Chưa có dữ liệu</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-1">
                            Không tìm thấy bản ghi thời gian nào khớp với bộ lọc của bạn.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {Object.entries(groupedLogs).map(([date, logs]) => (
                            <div key={date}>
                                <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {formatDate(date)}
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                        {logs.reduce((sum, l) => sum + l.hours, 0).toFixed(1)} giờ
                                    </span>
                                </div>

                                {logs.map((log) => (
                                    <div key={log.id} className="px-6 py-4 hover:bg-gray-50/30 transition-all group">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm shrink-0 border-2 border-white shadow-sm overflow-hidden text-nowrap">
                                                {log.user.avatar ? (
                                                    <Image src={log.user.avatar} alt={log.user.name} width={40} height={40} className="w-full h-full object-cover" />
                                                ) : log.user.name.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900 text-sm">{log.user.name}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{log.activity.name}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    {!initialTaskId && log.task && (
                                                        <Link href={`/tasks/${log.task.id}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">
                                                            <FileText className="w-3 h-3" />
                                                            #{log.task.number}: {log.task.title.substring(0, 40)}{log.task.title.length > 40 && '...'}
                                                        </Link>
                                                    )}
                                                    {!initialProjectId && (
                                                        <Link href={`/projects/${log.project.id}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all">
                                                            <Briefcase className="w-3 h-3" />
                                                            {log.project.name}
                                                        </Link>
                                                    )}
                                                </div>

                                                {log.comments && (
                                                    <p className="mt-2 text-sm text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 italic">
                                                        "{log.comments}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="text-lg font-black text-blue-600">{log.hours.toFixed(1)}h</div>
                                                <div className="flex items-center justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => setEditingLog(log)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(log.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Trước
                        </button>
                        <span className="text-sm font-bold text-gray-500">
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Sau
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showLogTimeModal && (
                <LogTimeModal
                    isOpen={showLogTimeModal}
                    onClose={() => setShowLogTimeModal(false)}
                    projectId={projectId || projects[0]?.id || ''}
                    taskId={taskId || undefined}
                    onSuccess={fetchTimeLogs}
                />
            )}

            {editingLog && (
                <EditTimeLogModal
                    log={editingLog}
                    activities={activities}
                    onClose={() => setEditingLog(null)}
                    onSuccess={fetchTimeLogs}
                />
            )}
        </div>
    );
}

function EditTimeLogModal({ log, activities, onClose, onSuccess }: { log: TimeLog; activities: ActivityOption[]; onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        hours: log.hours.toString(),
        spentOn: log.spentOn.split('T')[0],
        activityId: log.activity.id,
        comments: log.comments || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/spent-time/${log.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hours: parseFloat(formData.hours),
                    spentOn: formData.spentOn,
                    activityId: formData.activityId,
                    comments: formData.comments || null,
                }),
            });

            if (res.ok) {
                toast.success('Đã cập nhật bản ghi');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Pencil className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900">Chỉnh sửa thời gian</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 ml-1">Ngày thực hiện</label>
                            <input type="date" value={formData.spentOn} onChange={e => setFormData({ ...formData, spentOn: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 ml-1">Số giờ (h)</label>
                            <input type="number" step="0.1" min="0.1" value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" required />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Hoạt động</label>
                        <select value={formData.activityId} onChange={e => setFormData({ ...formData, activityId: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer" required>
                            {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 ml-1">Bình luận</label>
                        <textarea placeholder="Mô tả công việc..." value={formData.comments} onChange={e => setFormData({ ...formData, comments: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all" disabled={loading}>Hủy</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center min-w-[120px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
