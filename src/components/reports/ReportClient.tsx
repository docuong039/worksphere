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
import { reportService } from '@/services/report.service';
import type { ReportSummary, ReportProject, ReportUser, ReportTime } from '@/types';
import { ReportPolicy } from '@/modules/report/report.policy';
import DistributionChart from '@/components/charts/DistributionChart';
import TopPerformersChart from '@/components/charts/TopPerformersChart';

interface ReportClientProps {
    user: {
        id: string;
        name: string | null;
        isAdministrator: boolean;
    };
    permissions: string[];
}

export default function ReportClient({ user, permissions }: ReportClientProps) {
    const [reportType, setReportType] = useState<'summary' | 'by-project' | 'by-user' | 'by-time'>('summary');
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<ReportSummary | null>(null);
    const [projectReports, setProjectReports] = useState<ReportProject[]>([]);
    const [userReports, setUserReports] = useState<ReportUser[]>([]);
    const [timeReports, setTimeReports] = useState<ReportTime[]>([]);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await reportService.getReports(reportType, dateRange.startDate, dateRange.endDate);
            if (res.success) {
                const innerData = res.data?.data || res.data;
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
                    case 'by-time':
                        setTimeReports(innerData || []);
                        break;
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải báo cáo:', error);
        } finally {
            setLoading(false);
        }
    }, [reportType, dateRange.startDate, dateRange.endDate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Lọc các Tab dựa trên Policy (Bảo mật)
    const tabs = [
        { key: 'summary', label: 'Tổng quan', icon: PieChart, show: true },
        { key: 'by-project', label: 'Theo dự án', icon: Briefcase, show: true },
        {
            key: 'by-user',
            label: 'Theo người dùng',
            icon: Users,
            show: ReportPolicy.canViewUserReports(user, permissions)
        },
        {
            key: 'by-time',
            label: 'Thời gian',
            icon: Calendar,
            show: ReportPolicy.canViewTimeReports(user, permissions)
        },
    ].filter(t => t.show);

    return (
        <div className="space-y-6">
            {/* Header - Khôi phục font-semibold và text-2xl */}
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

            {/* Report Type Tabs - Khôi phục font-medium */}
            <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1 w-fit">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setReportType(key as any)}
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

            {/* Date Filter - Khôi phục text-gray-600 và font-medium */}
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
                    <div className="flex items-center gap-2 ml-auto">
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
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400 font-medium animate-pulse">
                    Đang tải dữ liệu báo cáo...
                </div>
            ) : (
                <>
                    {/* Summary Report */}
                    {reportType === 'summary' && summaryData && (
                        <div className="space-y-6">
                            <div className={`grid grid-cols-1 md:grid-cols-${(summaryData as any).totalHours !== undefined ? '5' : '4'} gap-4`}>
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dự án</p>
                                            <h3 className="text-xl font-bold text-gray-900">{summaryData.totalProjects}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tổng Task</p>
                                            <h3 className="text-xl font-bold text-gray-900">{summaryData.totalTasks}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quá hạn</p>
                                            <h3 className="text-xl font-bold text-red-600">{(summaryData as any).overdueTasks || 0}</h3>
                                        </div>
                                    </div>
                                </div>

                                {(summaryData as any).totalHours !== undefined && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                                                <PieChart className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tổng giờ làm</p>
                                                <h3 className="text-xl font-bold text-gray-900">{(summaryData as any).totalHours || 0}h</h3>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tiến độ</p>
                                            <h3 className="text-xl font-bold text-gray-900">{summaryData.completionRate}%</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Phân bổ trạng thái */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                        <BarChart3 className="w-4 h-4 text-blue-600" />
                                        Trạng thái công việc
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-500"
                                                        style={{ width: `${summaryData.completionRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-gray-700 min-w-[40px] text-right">{summaryData.completionRate}%</div>
                                        </div>
                                        <div className="flex justify-around pt-2">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-900">{summaryData.openTasks}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đang mở</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-emerald-600">{summaryData.closedTasks}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đã hoàn thành</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Phân bổ loại hình công việc (Trackers) */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                        <PieChart className="w-4 h-4 text-amber-600" />
                                        Cấu trúc loại công việc
                                    </h3>
                                    <div className="h-[300px] flex items-center justify-center">
                                        {(summaryData as any).trackerBreakdown?.length > 0 ? (
                                            <DistributionChart data={(summaryData as any).trackerBreakdown} />
                                        ) : (
                                            <div className="text-gray-400 text-sm italic py-8">
                                                Chưa có dữ liệu phân bổ
                                            </div>
                                        )}
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
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Quá hạn</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Tiến độ</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {projectReports.map((p: any) => (
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
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold ${p.overdueTasks > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {p.overdueTasks}
                                                    </span>
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
                        <div className="space-y-6">
                            {/* Top Performers Chart */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    Top thành viên tích cực
                                </h3>
                                <div className="h-[350px]">
                                    {userReports.length > 0 ? (
                                        <TopPerformersChart
                                            data={[...userReports]
                                                .sort((a, b) => b.closedTasks - a.closedTasks)
                                                .slice(0, 5)
                                                .map(u => ({ name: u.name, closedTasks: u.closedTasks }))
                                            }
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                            Chưa có dữ liệu so sánh
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Người dùng</th>
                                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Tổng gán</th>
                                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Quá hạn</th>
                                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Đang mở</th>
                                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Đã đóng</th>
                                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Hiệu suất</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {userReports.map((u: any) => {
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
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`font-bold ${u.overdueTasks > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                                {u.overdueTasks}
                                                            </span>
                                                        </td>
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
                        </div>
                    )}

                    {/* Time Report */}
                    {reportType === 'by-time' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Chi tiết công việc</th>
                                            <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider">Tổng giờ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {timeReports.map((t: any) => (
                                            <tr key={t.userId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 align-top w-48">
                                                    {t.userName}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="space-y-4">
                                                        {/* Theo dự án */}
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dự án</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(t.projects).map(([projName, hours]: any) => (
                                                                    <div key={projName} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                                                                        <span className="text-gray-600 text-xs">{projName}</span>
                                                                        <span className="font-bold text-gray-900 text-xs">{hours}h</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {/* Theo loại công việc */}
                                                        {t.activities && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Loại hoạt động</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {Object.entries(t.activities).map(([actName, hours]: any) => (
                                                                        <div key={actName} className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1 rounded-lg">
                                                                            <span className="text-blue-700 text-xs">{actName}</span>
                                                                            <span className="font-bold text-blue-900 text-xs">{hours}h</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-600 align-top text-lg">
                                                    {t.totalHours}h
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {timeReports.length === 0 && (
                                <div className="p-12 text-center text-gray-500 font-medium bg-gray-50/30">Chưa có dữ liệu chấm công</div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
