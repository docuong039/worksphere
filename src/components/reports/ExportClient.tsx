'use client';

import { useState, useEffect } from 'react';
import {
    Download,
    Calendar,
    Briefcase,
    Users,
    CheckCircle,
    Loader2,
    Filter,
    FileSpreadsheet,
    ArrowLeft,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfmake with fonts
pdfMake.vfs = pdfFonts.vfs;

interface ProjectOption {
    id: string;
    name: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface TaskData {
    number: number;
    title: string;
    project: { name: string };
    tracker: { name: string };
    status: { name: string };
    priority: { name: string };
    assignee: { name: string } | null;
    doneRatio: number;
    startDate: string | null;
    dueDate: string | null;
}

interface TimeLogData {
    id: string;
    hours: number;
    comments: string | null;
    spentOn: string;
    project: { name: string };
    user: { name: string };
    activity: { name: string };
    task: { title: string; number: number } | null;
}
import { ReportPolicy } from '@/server/policies/report.policy';

interface ExportClientProps {
    user: {
        id: string;
        name: string | null;
        isAdministrator: boolean;
    };
    permissions: string[];
}

export default function ExportClient({ user, permissions }: ExportClientProps) {
    const canViewTimeReports = ReportPolicy.canViewTimeReports(user, permissions);
    const personnelScope = ReportPolicy.getPersonnelVisibilityScope(user, permissions);

    // Filter states
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [quickFilter, setQuickFilter] = useState<'week' | 'month' | 'last-month' | 'quarter' | ''>('');
    const [exportType, setExportType] = useState<'tasks' | 'time'>('tasks');

    // Options
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    // UI states
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<'csv' | 'pdf' | null>(null);

    // Fetch filter options on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [projectsRes, usersRes] = await Promise.all([
                    fetch('/api/projects?pageSize=100'),
                    fetch('/api/users?pageSize=100&excludeAdmins=true')
                ]);
                const projectsData = await projectsRes.json();
                const usersData = await usersRes.json();

                if (projectsData.success) {
                    setProjects(projectsData.data.projects || projectsData.data || []);
                }
                if (usersData.success) {
                    let fetchedUsers: UserOption[] = usersData.data.users || usersData.data || [];
                    if (personnelScope === 'SELF') {
                        fetchedUsers = fetchedUsers.filter(u => u.id === user.id);
                    }
                    setUsers(fetchedUsers);
                    if (personnelScope === 'SELF') {
                        setSelectedUserId(user.id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch options', error);
            }
        };
        fetchOptions();
    }, []);

    // Quick filter helpers
    const applyQuickFilter = (type: 'week' | 'month' | 'last-month' | 'quarter') => {
        const now = new Date();
        let start: Date, end: Date;

        if (type === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(now.getFullYear(), now.getMonth(), diff);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else if (type === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (type === 'last-month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else {
            // Quarter
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1);
            end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        }

        setQuickFilter(type);
        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        });
    };

    // Build params for API call
    const buildParams = () => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dateRange.startDate);
        if (dateRange.endDate) params.set('endDate', dateRange.endDate);
        if (selectedProjectId) params.set('projectId', selectedProjectId);
        if (selectedUserId) params.set('assigneeId', selectedUserId);
        params.set('pageSize', '1000'); // Get all tasks
        return params;
    };

    // Export CSV handler
    const handleExportCSV = async () => {
        setExportingCSV(true);
        setExportSuccess(null);

        try {
            const params = new URLSearchParams({ type: exportType === 'tasks' ? 'tasks' : 'time-logs' });
            if (dateRange.startDate) params.set('startDate', dateRange.startDate);
            if (dateRange.endDate) params.set('endDate', dateRange.endDate);
            if (selectedProjectId) params.set('projectId', selectedProjectId);
            if (selectedUserId) params.set('userId', selectedUserId);

            const res = await fetch(`/api/reports/export?${params.toString()}`);

            if (!res.ok) {
                throw new Error('Export failed');
            }

            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = `cong-viec_${new Date().toISOString().split('T')[0]}.csv`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            } else {
                filename = exportType === 'tasks' ? 'cong-viec.csv' : 'thoi-gian.csv';
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            setExportSuccess('csv');
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            setExportingCSV(false);
        }
    };

    // Export PDF handler using pdfmake (supports Vietnamese)
    const handleExportPDF = async () => {
        setExportingPDF(true);
        setExportSuccess(null);

        try {
            // Fetch data based on type
            const params = buildParams();
            let tableHeaders: any[] = [];
            let tableBody: any[] = [];
            let title = '';

            if (exportType === 'tasks') {
                const res = await fetch(`/api/tasks?${params.toString()}`);
                const data = await res.json();
                if (!data.success) throw new Error('Failed to fetch tasks');

                const tasks: TaskData[] = data.data.tasks || data.data || [];
                title = 'Danh sách Công việc';

                tableHeaders = [
                    { text: '#', style: 'tableHeader' },
                    { text: 'Tiêu đề', style: 'tableHeader' },
                    { text: 'Dự án', style: 'tableHeader' },
                    { text: 'Loại', style: 'tableHeader' },
                    { text: 'Trạng thái', style: 'tableHeader' },
                    { text: 'Ưu tiên', style: 'tableHeader' },
                    { text: 'Người TH', style: 'tableHeader' },
                    { text: '%', style: 'tableHeader' },
                    { text: 'Hết hạn', style: 'tableHeader' }
                ];

                tableBody = tasks.map(task => [
                    { text: String(task.number), alignment: 'center' },
                    task.title.length > 50 ? task.title.substring(0, 50) + '...' : task.title,
                    task.project.name,
                    task.tracker.name,
                    task.status.name,
                    task.priority.name,
                    task.assignee?.name || '-',
                    { text: `${task.doneRatio}%`, alignment: 'center' },
                    { text: task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-', alignment: 'center' }
                ]);

            } else {
                const res = await fetch(`/api/time-logs?${params.toString()}`);
                const data = await res.json();
                if (!data.success) throw new Error('Failed to fetch time logs');

                const logs: TimeLogData[] = data.data.timeLogs || [];
                title = 'Báo cáo Thời gian (Logs)';

                tableHeaders = [
                    { text: 'Ngày', style: 'tableHeader' },
                    { text: 'Nhân viên', style: 'tableHeader' },
                    { text: 'Dự án', style: 'tableHeader' },
                    { text: 'Công việc', style: 'tableHeader' },
                    { text: 'Hoạt động', style: 'tableHeader' },
                    { text: 'Giờ', style: 'tableHeader' },
                    { text: 'Ghi chú', style: 'tableHeader' }
                ];

                tableBody = logs.map(log => [
                    { text: new Date(log.spentOn).toLocaleDateString('vi-VN'), alignment: 'center' },
                    log.user.name,
                    log.project.name,
                    log.task ? `#${log.task.number} ${log.task.title}`.substring(0, 40) : '-',
                    log.activity.name,
                    { text: String(log.hours), alignment: 'center', bold: true },
                    log.comments || ''
                ]);
            }

            // Build subtitle
            let subtitle = 'Xuất ngày: ' + new Date().toLocaleDateString('vi-VN');
            if (dateRange.startDate || dateRange.endDate) {
                subtitle += ` | Thời gian: ${dateRange.startDate || '...'} đến ${dateRange.endDate || '...'}`;
            }
            if (selectedProjectId) {
                const projectName = projects.find(p => p.id === selectedProjectId)?.name;
                subtitle += ` | Dự án: ${projectName}`;
            }
            if (selectedUserId) {
                const userName = users.find(u => u.id === selectedUserId)?.name;
                subtitle += ` | Nhân sự: ${userName}`;
            }

            // Create PDF document definition
            const docDefinition = {
                pageOrientation: 'landscape' as const,
                pageSize: 'A4' as const,
                pageMargins: [20, 20, 20, 30] as [number, number, number, number],
                content: [
                    { text: title, style: 'header' },
                    { text: subtitle, style: 'subheader' },
                    { text: ' ', margin: [0, 5, 0, 5] as [number, number, number, number] },
                    {
                        table: {
                            headerRows: 1,
                            widths: exportType === 'tasks'
                                ? [25, '*', 60, 45, 55, 45, 70, 30, 55]
                                : [60, 80, 80, '*', 70, 30, 100],
                            body: [
                                tableHeaders,
                                ...tableBody
                            ]
                        },
                        layout: {
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#E5E7EB',
                            vLineColor: () => '#E5E7EB',
                            fillColor: (rowIndex: number) => rowIndex === 0 ? '#3B82F6' : (rowIndex % 2 === 0 ? '#F9FAFB' : null)
                        }
                    }
                ],
                footer: (currentPage: number, pageCount: number) => ({
                    text: `Trang ${currentPage} / ${pageCount}`,
                    alignment: 'right' as const,
                    margin: [0, 0, 20, 0] as [number, number, number, number],
                    fontSize: 10,
                    color: '#6B7280'
                }),
                styles: {
                    header: {
                        fontSize: 22,
                        bold: true,
                        color: '#1F2937',
                        margin: [0, 0, 0, 8] as [number, number, number, number]
                    },
                    subheader: {
                        fontSize: 12,
                        color: '#6B7280',
                        margin: [0, 0, 0, 15] as [number, number, number, number]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 11,
                        color: 'white',
                        fillColor: '#3B82F6',
                        alignment: 'center' as const
                    }
                },
                defaultStyle: {
                    fontSize: 10
                }
            };

            // Generate and download PDF
            pdfMake.createPdf(docDefinition).download(`${exportType === 'tasks' ? 'cong-viec' : 'thoi-gian'}_${new Date().toISOString().split('T')[0]}.pdf`);

            setExportSuccess('pdf');
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (error) {
            console.error('PDF export failed', error);
        } finally {
            setExportingPDF(false);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setDateRange({ startDate: '', endDate: '' });
        setSelectedProjectId('');
        setSelectedUserId('');
        setQuickFilter('');
    };

    const isExporting = exportingCSV || exportingPDF;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/reports"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                        Xuất dữ liệu hệ thống
                    </h1>
                    <p className="text-gray-500 mt-1">Xuất danh sách công việc hoặc lịch sử thời gian ra file CSV/PDF</p>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Export Type Selector */}
                <div className="p-5 border-b border-gray-100 flex gap-4">
                    <button
                        onClick={() => setExportType('tasks')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${exportType === 'tasks' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'
                            }`}
                    >
                        <Briefcase className="w-5 h-5" />
                        Xuất Công việc
                    </button>
                    {canViewTimeReports && (
                        <button
                            onClick={() => setExportType('time')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${exportType === 'time' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'
                                }`}
                        >
                            <Calendar className="w-5 h-5" />
                            Xuất Thời gian (Logs)
                        </button>
                    )}
                </div>

                {/* Quick Date Filters */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Khoảng thời gian</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'week', label: 'Tuần này' },
                            { key: 'month', label: 'Tháng này' },
                            { key: 'last-month', label: 'Tháng trước' },
                            { key: 'quarter', label: 'Quý này' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => applyQuickFilter(key as 'week' | 'month' | 'last-month' | 'quarter')}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${quickFilter === key
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Range */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Từ</span>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => { setQuickFilter(''); setDateRange({ ...dateRange, startDate: e.target.value }); }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">đến</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => { setQuickFilter(''); setDateRange({ ...dateRange, endDate: e.target.value }); }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Filters */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Bộ lọc</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Project Filter */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                Dự án
                            </label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">Tất cả dự án</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* User Filter */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                                <Users className="w-3.5 h-3.5" />
                                Người thực hiện
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                disabled={personnelScope === 'SELF'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                {personnelScope !== 'SELF' && <option value="">Tất cả người dùng</option>}
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary & Export */}
                <div className="p-5 bg-gray-50/50">
                    {/* Filter Summary */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(dateRange.startDate || dateRange.endDate) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                                <Calendar className="w-3 h-3" />
                                {dateRange.startDate || '...'} → {dateRange.endDate || '...'}
                            </span>
                        )}
                        {selectedProjectId && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                                <Briefcase className="w-3 h-3" />
                                {projects.find(p => p.id === selectedProjectId)?.name}
                            </span>
                        )}
                        {selectedUserId && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-md">
                                <Users className="w-3 h-3" />
                                {users.find(u => u.id === selectedUserId)?.name}
                            </span>
                        )}
                        {!dateRange.startDate && !dateRange.endDate && !selectedProjectId && !selectedUserId && (
                            <span className="text-sm text-gray-500">Không có bộ lọc - xuất tất cả công việc</span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* CSV Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${exportSuccess === 'csv'
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {exportingCSV ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xuất...
                                </>
                            ) : exportSuccess === 'csv' ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Đã xuất CSV!
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Xuất CSV
                                </>
                            )}
                        </button>

                        {/* PDF Button */}
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${exportSuccess === 'pdf'
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white hover:bg-red-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {exportingPDF ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xuất...
                                </>
                            ) : exportSuccess === 'pdf' ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Đã xuất PDF!
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Xuất PDF
                                </>
                            )}
                        </button>

                        {(dateRange.startDate || dateRange.endDate || selectedProjectId || selectedUserId) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-400 space-y-1">
                <p>CSV: Dữ liệu bảng tính, mở bằng Excel/Google Sheets</p>
                <p>PDF: Báo cáo định dạng in ấn, xem trực tiếp</p>
            </div>
        </div>
    );
}
