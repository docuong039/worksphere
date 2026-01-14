'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, User, ArrowLeft, ListTodo } from 'lucide-react';

interface UserSummary {
    userId: string;
    userName: string;
    avatar: string | null;
    totalHours: number;
    taskCount: number;
}

interface TaskItem {
    id: string;
    number: number;
    title: string;
    estimatedHours: number;
    doneRatio: number;
    status: { id: string; name: string; isClosed: boolean };
    tracker: { id: string; name: string };
    parent: { id: string; number: number; title: string } | null;
    project: { id: string; name: string; identifier: string };
}

interface TimeLogsContentProps {
    projectId?: string;
    hideProjectFilter?: boolean;
    titleSize?: 'sm' | 'md' | 'lg';
}

export function TimeLogsContent({
    projectId: initialProjectId,
    hideProjectFilter = false,
    titleSize = 'lg'
}: TimeLogsContentProps) {
    const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
    const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
    const [summaryData, setSummaryData] = useState<UserSummary[]>([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [detailTasks, setDetailTasks] = useState<TaskItem[]>([]);
    const [detailTotalHours, setDetailTotalHours] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Project filter state
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');

    // Fetch Projects for filter
    useEffect(() => {
        if (hideProjectFilter) return;
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                const data = await res.json();
                if (data.success) {
                    setProjects(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            }
        };
        fetchProjects();
    }, [hideProjectFilter]);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const currentPid = initialProjectId || selectedProjectId;
            const url = currentPid
                ? `/api/time-logs?projectId=${currentPid}`
                : '/api/time-logs';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setSummaryData(data.data.summary || []);
                setGrandTotal(data.data.grandTotal || 0);
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        } finally {
            setLoading(false);
        }
    }, [initialProjectId, selectedProjectId]);

    const fetchDetails = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const currentPid = initialProjectId || selectedProjectId;
            let url = `/api/time-logs?userId=${userId}&page=${page}&limit=20`;
            if (currentPid) url += `&projectId=${currentPid}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setDetailTasks(data.data.tasks || []);
                setDetailTotalHours(data.data.totalHours || 0);
                setTotalPages(data.data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch details:', error);
        } finally {
            setLoading(false);
        }
    }, [initialProjectId, selectedProjectId, page]);

    useEffect(() => {
        if (viewMode === 'summary') {
            fetchSummary();
        } else if (selectedUser) {
            fetchDetails(selectedUser.userId);
        }
    }, [viewMode, selectedUser, fetchSummary, fetchDetails]);

    const handleSelectUser = (user: UserSummary) => {
        setSelectedUser(user);
        setViewMode('detail');
        setPage(1);
    };

    const handleBack = () => {
        setViewMode('summary');
        setSelectedUser(null);
        setPage(1);
    };

    const titleClasses = titleSize === 'lg' ? 'text-2xl' : titleSize === 'md' ? 'text-xl' : 'text-lg';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {viewMode === 'detail' && (
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                    <div>
                        <h1 className={`${titleClasses} font-semibold text-gray-900 flex items-center gap-2`}>
                            <Clock className="w-6 h-6 text-blue-600" />
                            {viewMode === 'summary' ? 'Tổng hợp thời gian' : `Chi tiết: ${selectedUser?.userName}`}
                        </h1>
                        {titleSize === 'lg' && (
                            <p className="text-sm text-gray-500 mt-1">
                                {viewMode === 'summary'
                                    ? 'Thống kê giờ dự kiến từ các công việc được giao'
                                    : `Danh sách công việc của ${selectedUser?.userName}`}
                            </p>
                        )}
                    </div>
                </div>

                {!hideProjectFilter && (
                    <div className="flex items-center gap-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        <label htmlFor="project-filter" className="text-sm font-bold text-blue-800 whitespace-nowrap pl-1">
                            Dự án:
                        </label>
                        <select
                            id="project-filter"
                            value={selectedProjectId}
                            onChange={(e) => {
                                setSelectedProjectId(e.target.value);
                                setPage(1);
                            }}
                            className="block w-full md:w-64 pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm bg-white"
                        >
                            <option value="">Tất cả dự án</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                            {viewMode === 'summary' ? 'Tổng giờ dự kiến' : 'Giờ dự kiến'}
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            {viewMode === 'summary' ? grandTotal.toFixed(1) : detailTotalHours.toFixed(1)}h
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                            {viewMode === 'summary' ? 'Thành viên' : 'Công việc'}
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            {viewMode === 'summary' ? summaryData.length : detailTasks.length}
                        </h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        {viewMode === 'summary' ? <User className="w-6 h-6" /> : <ListTodo className="w-6 h-6" />}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-nowrap scrollbar-none">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        Đang tải dữ liệu...
                    </div>
                ) : (
                    <>
                        {viewMode === 'summary' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Thành viên</th>
                                            <th className="px-6 py-4">Số công việc</th>
                                            <th className="px-6 py-4">Tỷ lệ</th>
                                            <th className="px-6 py-4 text-right">Giờ làm</th>
                                            <th className="px-6 py-4 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {summaryData.map((user) => (
                                            <tr key={user.userId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100 uppercase overflow-hidden">
                                                            {user.avatar ? (
                                                                <Image src={user.avatar} alt={user.userName} width={32} height={32} className="w-full h-full object-cover" />
                                                            ) : (
                                                                user.userName.charAt(0)
                                                            )}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{user.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {user.taskCount} task
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 rounded-full"
                                                            style={{ width: `${grandTotal > 0 ? (user.totalHours / grandTotal) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                    {user.totalHours.toFixed(1)}h
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleSelectUser(user)}
                                                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {summaryData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic font-medium">
                                                    Chưa có dữ liệu thời gian công việc.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">Công việc</th>
                                                <th className="px-6 py-4">Tracker</th>
                                                <th className="px-6 py-4">Trạng thái</th>
                                                <th className="px-6 py-4">% Xong</th>
                                                <th className="px-6 py-4 text-right">Giờ làm</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {detailTasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <Link href={`/tasks/${task.id}`} className="font-semibold text-blue-600 hover:underline">
                                                                #{task.number} {task.title}
                                                            </Link>
                                                            {!initialProjectId && (
                                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                                                    <span>{task.project.name}</span>
                                                                </div>
                                                            )}
                                                            {task.parent && (
                                                                <div className="mt-0.5 text-[10px] text-gray-500">
                                                                    <span>Cha: #{task.parent.number}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-600">
                                                        {task.tracker.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-medium ${task.status.isClosed ? 'text-green-600' : 'text-blue-600'}`}>
                                                            {task.status.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500" style={{ width: `${task.doneRatio}%` }} />
                                                            </div>
                                                            <span className="text-xs text-gray-500">{task.doneRatio}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                        {task.estimatedHours}h
                                                    </td>
                                                </tr>
                                            ))}
                                            {detailTasks.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                                        Chưa có công việc nào.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <p className="text-xs text-gray-500">Trang {page} / {totalPages}</p>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-1.5 rounded border bg-white text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                            className="p-1.5 rounded border bg-white text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
