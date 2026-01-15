'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    BarChart3,
    PieChart,
    Users,
    Briefcase,
    Calendar,
    TrendingUp,
    ArrowRight
} from 'lucide-react';

interface SummaryData {
    totalProjects: number;
    totalTasks: number;
    openTasks: number;
    closedTasks: number;
    completionRate: number;
}

interface ProjectReport {
    id: string;
    name: string;
    totalTasks: number;
    totalMembers: number;
    openTasks: number;
    closedTasks: number;
    completionRate: number;
}

interface UserReport {
    id: string;
    name: string;
    email: string;
    totalAssigned: number;
    openTasks: number;
    closedTasks: number;
}

export default function ReportsPage() {
    const [reportType, setReportType] = useState<'summary' | 'by-project' | 'by-user'>('summary');
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: reportType });
            if (dateRange.startDate) params.set('startDate', dateRange.startDate);
            if (dateRange.endDate) params.set('endDate', dateRange.endDate);

            const res = await fetch(`/api/reports?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                const innerData = data.data?.data || data.data;
                switch (reportType) {
                    case 'summary':
                        setSummaryData(innerData);
                        break;
                    case 'by-project':
                        setProjectReports(innerData || []);
                        break;
                    case 'by-user':
                        setUserReports(innerData || []);
                        break;
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [reportType, dateRange.startDate, dateRange.endDate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Báo cáo</h1>
                    <p className="text-gray-500 mt-1">Xem thống kê và phân tích dữ liệu công việc</p>
                </div>
                <Link
                    href="/reports/export"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <ArrowRight className="w-4 h-4" />
                    Xuất báo cáo
                </Link>
            </div>

            {/* Report Type Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1 w-fit">
                {[
                    { key: 'summary', label: 'Tổng quan', icon: PieChart },
                    { key: 'by-project', label: 'Theo dự án', icon: Briefcase },
                    { key: 'by-user', label: 'Theo người dùng', icon: Users },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setReportType(key as 'summary' | 'by-project' | 'by-user')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === key
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Từ ngày</span>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">đến</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchReport}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Áp dụng
                        </button>
                        <button
                            onClick={() => {
                                setDateRange({ startDate: '', endDate: '' });
                                setTimeout(fetchReport, 0);
                            }}
                            className="px-4 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="animate-pulse text-gray-400">Đang tải dữ liệu báo cáo...</div>
                </div>
            ) : (
                <>
                    {/* Summary Report */}
                    {reportType === 'summary' && summaryData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Dự án đang chạy</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{summaryData.totalProjects}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <BarChart3 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tổng số công việc</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{summaryData.totalTasks}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tỉ lệ hoàn thành</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{summaryData.completionRate}%</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Task breakdown */}
                            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Phân bổ trạng thái công việc
                                </h3>
                                <div className="flex flex-col md:flex-row items-center gap-12">
                                    <div className="flex-1 w-full">
                                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${summaryData.completionRate}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-3 text-sm font-medium">
                                            <span className="text-gray-500">Hoàn thành ({summaryData.completionRate}%)</span>
                                            <span className="text-gray-500">Đang thực hiện ({100 - summaryData.completionRate}%)</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-10">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-gray-900 mb-1">{summaryData.openTasks}</div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đang mở</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-emerald-600 mb-1">{summaryData.closedTasks}</div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã đóng</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Project Report */}
                    {reportType === 'by-project' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Dự án</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Thành viên</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Tổng Task</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Tiến độ</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {projectReports.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <Link href={`/projects/${p.id}`} className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {p.name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-gray-600">{p.totalMembers}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-gray-900">{p.totalTasks}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                            {p.openTasks} mở / {p.closedTasks} đóng
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${p.completionRate}%` }} />
                                                        </div>
                                                        <span className="font-bold text-gray-700 min-w-[3ch]">{p.completionRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/projects/${p.id}`} className="text-gray-400 hover:text-blue-600">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {projectReports.length === 0 && (
                                <div className="p-12 text-center text-gray-500 font-medium bg-gray-50/30">Chưa có dữ liệu dự án</div>
                            )}
                        </div>
                    )}

                    {/* User Report */}
                    {reportType === 'by-user' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Người dùng</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Tổng gán</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Đang mở</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Đã đóng</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Hiệu suất</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {userReports.map((u) => {
                                            const perf = u.totalAssigned > 0 ? Math.round((u.closedTasks / u.totalAssigned) * 100) : 0;
                                            return (
                                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-bold text-gray-900">{u.name}</div>
                                                            <div className="text-xs text-gray-400 font-medium">{u.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-900">{u.totalAssigned}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-orange-600">{u.openTasks}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{u.closedTasks}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${perf >= 70 ? 'bg-emerald-50 text-emerald-700' : perf >= 40 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                                                            {perf}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {userReports.length === 0 && (
                                <div className="p-12 text-center text-gray-500 font-medium bg-gray-50/30">Chưa có dữ liệu người dùng</div>
                            )}
                        </div>
                    )}


                </>
            )}
        </div>
    );
}
