'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
    status: { name: string; isClosed: boolean };
    priority: { name: string };
    assignee: { name: string } | null;
    doneRatio: number;
    startDate: string | null;
    dueDate: string | null;
    updatedAt: string;
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
    projectPermissionsMap: Record<string, string[]>;
}

export default function ExportClient({ user, projectPermissionsMap }: ExportClientProps) {
    // ── Filter states ─────────────────────────────────────────────────────────
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [quickFilter, setQuickFilter] = useState<'week' | 'month' | 'last-month' | 'quarter' | ''>('');
    const [exportType, setExportType] = useState<'tasks' | 'time'>('tasks');

    // ── Options ───────────────────────────────────────────────────────────────
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    // ── UI states ─────────────────────────────────────────────────────────────
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<'csv' | 'pdf' | null>(null);

    // ── Derived permissions (computed synchronously — no state needed) ────────
    // If user has selected a project, use ONLY that project's permissions.
    // If no project selected, merge all memberships (sensible global default).
    const currentPermissions: string[] = (() => {
        if (user.isAdministrator) return [];   // admin: policy handles via user.isAdministrator
        if (selectedProjectId && projectPermissionsMap[selectedProjectId]) {
            return projectPermissionsMap[selectedProjectId];
        }
        // No project selected → union of all membership permissions
        const allKeys = new Set<string>();
        Object.values(projectPermissionsMap).forEach(perms =>
            perms.forEach(k => allKeys.add(k))
        );
        return Array.from(allKeys);
    })();

    const canViewTimeReports = ReportPolicy.canViewTimeReports(user, currentPermissions);
    const personnelScope = ReportPolicy.getPersonnelVisibilityScope(user, currentPermissions);
    const exportScope = ReportPolicy.getExportScope(user, currentPermissions);

    // ── Fetch projects once on mount ──────────────────────────────────────────
    useEffect(() => {
        fetch('/api/projects?pageSize=100')
            .then(r => r.json())
            .then(d => { if (d.success) setProjects(d.data.projects || d.data || []); })
            .catch(console.error);
    }, []);

    // ── Fetch user list whenever selected project changes ─────────────────────
    useEffect(() => {
        const params = new URLSearchParams({
            pageSize: '500',
            excludeAdmins: 'true',
            forExport: 'true',
        });
        if (selectedProjectId) params.set('projectId', selectedProjectId);

        fetch(`/api/users?${params}`)
            .then(r => r.json())
            .then(d => {
                if (!d.success) return;
                let list: UserOption[] = d.data.users || d.data || [];
                if (exportScope === 'OWN') {
                    list = list.filter(u => u.id === user.id);
                }
                setUsers(list);
                // Auto-select self for OWN scope; clear if previous selection gone
                if (exportScope === 'OWN') {
                    setSelectedUserId(user.id);
                } else if (selectedUserId && !list.some(u => u.id === selectedUserId)) {
                    setSelectedUserId('');
                }
            })
            .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId, exportScope]);

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
        if (exportScope === 'NONE') {
            alert('Bạn không có quyền xuất báo cáo. Liên hệ quản trị viên để được cấp quyền.');
            return;
        }
        setExportingCSV(true);
        setExportSuccess(null);

        try {
            const typeParam = exportType === 'tasks' ? 'tasks' : 'time-logs';
            const params = new URLSearchParams({ type: typeParam });
            if (dateRange.startDate) params.set('startDate', dateRange.startDate);
            if (dateRange.endDate) params.set('endDate', dateRange.endDate);
            if (selectedProjectId) params.set('projectId', selectedProjectId);
            if (selectedUserId) params.set('userId', selectedUserId);

            const res = await fetch(`/api/reports/export?${params.toString()}`);

            if (!res.ok) {
                throw new Error('Không thể xuất dữ liệu. Vui lòng thử lại.');
            }

            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = `cong-viec_${new Date().toISOString().split('T')[0]}.csv`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            } else {
                if (exportType === 'tasks') filename = 'cong-viec.csv';
                else filename = 'thoi-gian.csv';
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
        if (exportScope === 'NONE') {
            alert('Bạn không có quyền xuất báo cáo. Liên hệ quản trị viên để được cấp quyền.');
            return;
        }
        setExportingPDF(true);
        setExportSuccess(null);

        try {
            const params = new URLSearchParams();
            params.set('pageSize', '1000');
            if (selectedProjectId) params.set('projectId', selectedProjectId);

            if (exportType === 'tasks') {
                if (dateRange.startDate) params.set('createdAtFrom', dateRange.startDate);
                if (dateRange.endDate) params.set('createdAtTo', dateRange.endDate);
                if (selectedUserId) params.set('assigneeId', selectedUserId);
            } else {
                if (dateRange.startDate) params.set('from', dateRange.startDate);
                if (dateRange.endDate) params.set('to', dateRange.endDate);
                if (selectedUserId) params.set('userId', selectedUserId);
            }

            let tableHeaders: any[] = [];
            let tableBody: any[] = [];
            let userTotals = new Map<string, number>();

            let totalTasks = 0;
            let overdueTasks = 0;
            const statusCounts = new Map<string, number>();
            const taskUserStats = new Map<string, { total: number, completed: number, completedLate: number, overdue: number }>();

            let title = '';

            if (exportType === 'tasks') {
                const res = await fetch(`/api/tasks?${params.toString()}`);
                const data = await res.json();
                if (!data.success) throw new Error('Không thể tải danh sách công việc');

                const tasks: TaskData[] = data.data.tasks || data.data || [];
                title = 'Danh sách Công việc';

                tableHeaders = [
                    { text: '#', style: 'tableHeader' },
                    { text: 'Tiêu đề', style: 'tableHeader' },
                    { text: 'Dự án', style: 'tableHeader' },
                    { text: 'Trạng thái', style: 'tableHeader' },
                    { text: 'Ưu tiên', style: 'tableHeader' },
                    { text: 'Người TH', style: 'tableHeader' },
                    { text: '%', style: 'tableHeader' },
                    { text: 'Hết hạn', style: 'tableHeader' },
                    { text: 'Tiến độ', style: 'tableHeader' }
                ];

                tableBody = tasks.map(task => {
                    totalTasks++;
                    statusCounts.set(task.status.name, (statusCounts.get(task.status.name) || 0) + 1);

                    const assigneeName = task.assignee?.name || 'Chưa phân công';
                    if (!taskUserStats.has(assigneeName)) {
                        taskUserStats.set(assigneeName, { total: 0, completed: 0, completedLate: 0, overdue: 0 });
                    }
                    const uStat = taskUserStats.get(assigneeName)!;
                    uStat.total++;

                    let completionStatus = 'Chưa hoàn thành';
                    let statusColor = '#6B7280';

                    if (task.status.isClosed) {
                        uStat.completed++;
                        if (task.dueDate && new Date(task.updatedAt) > new Date(task.dueDate)) {
                            uStat.completedLate++;
                            const delayDays = Math.ceil((new Date(task.updatedAt).getTime() - new Date(task.dueDate).getTime()) / (1000 * 3600 * 24));
                            completionStatus = `Trễ ${delayDays} ngày`;
                            statusColor = '#EF4444';
                        } else {
                            completionStatus = 'Hoàn thành';
                            statusColor = '#10B981';
                        }
                    } else {
                        if (task.dueDate && new Date() > new Date(task.dueDate)) {
                            overdueTasks++;
                            uStat.overdue++;
                        }
                    }

                    return [
                        { text: String(task.number), alignment: 'center' },
                        task.title,
                        task.project.name,
                        task.status.name,
                        task.priority.name,
                        task.assignee?.name || '-',
                        { text: `${task.doneRatio}%`, alignment: 'center' },
                        { text: task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-', alignment: 'center' },
                        { text: completionStatus, alignment: 'center', color: statusColor, bold: true }
                    ];
                });

            } else {
                const res = await fetch(`/api/time-logs?${params.toString()}`);
                const data = await res.json();
                if (!data.success) throw new Error('Không thể tải lịch sử thời gian');

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

                let totalHours = 0;
                tableBody = logs.map(log => {
                    totalHours += log.hours;
                    userTotals.set(log.user.name, (userTotals.get(log.user.name) || 0) + log.hours);
                    return [
                        { text: new Date(log.spentOn).toLocaleDateString('vi-VN'), alignment: 'center' },
                        log.user.name,
                        log.project.name,
                        log.task ? `#${log.task.number} ${log.task.title}` : '-',
                        log.activity.name,
                        { text: String(log.hours), alignment: 'center' },
                        log.comments || ''
                    ];
                });

                tableBody.push([
                    { text: '', border: [false, false, false, false] },
                    { text: '', border: [false, false, false, false] },
                    { text: '', border: [false, false, false, false] },
                    { text: '', border: [false, false, false, false] },
                    { text: 'TỔNG CỘNG:', alignment: 'right', bold: true },
                    { text: String(Number(totalHours.toFixed(1))), alignment: 'center', bold: true, color: 'blue' },
                    { text: '', border: [false, false, false, false] }
                ]);
            }

            // Build subtitle
            let subtitle = 'Xuất ngày: ' + new Date().toLocaleDateString('vi-VN');
            const formatDisplayDateInner = (isoString?: string | null) => {
                if (!isoString) return '...';
                const parts = isoString.split('-');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return isoString;
            };

            if (dateRange.startDate || dateRange.endDate) {
                subtitle += ` | Thời gian: ${formatDisplayDateInner(dateRange.startDate)} đến ${formatDisplayDateInner(dateRange.endDate)}`;
            }
            if (selectedProjectId) {
                const projectName = projects.find(p => p.id === selectedProjectId)?.name;
                subtitle += ` | Dự án: ${projectName}`;
            }
            if (selectedUserId) {
                const userName = users.find(u => u.id === selectedUserId)?.name;
                subtitle += ` | Nhân sự: ${userName}`;
            }

            const docContent: any[] = [
                { text: title, style: 'header' },
                { text: subtitle, style: 'subheader' },
                { text: ' ', margin: [0, 5, 0, 5] as [number, number, number, number] },
                {
                    table: {
                        headerRows: 1,
                        widths: exportType === 'tasks'
                            ? [20, '*', 60, 55, 45, 60, 25, 55, 70]
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
            ];

            if (exportType === 'time' && userTotals.size > 0) {
                const summaryBody = [
                    [{ text: 'Nhân sự', style: 'tableHeader' }, { text: 'Tổng số giờ', style: 'tableHeader' }],
                    ...Array.from(userTotals.entries()).map(([name, hours]) => [
                        name,
                        { text: String(Number(hours.toFixed(1))), alignment: 'center', bold: true }
                    ])
                ];

                docContent.push({ text: ' ', margin: [0, 15, 0, 0] as [number, number, number, number] });
                docContent.push({ text: 'Tổng hợp theo nhân sự', style: 'subheader', margin: [0, 0, 0, 8] as [number, number, number, number] });
                docContent.push({
                    table: {
                        headerRows: 1,
                        widths: [150, 100],
                        body: summaryBody
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#E5E7EB',
                        vLineColor: () => '#E5E7EB',
                        fillColor: (rowIndex: number) => rowIndex === 0 ? '#10B981' : (rowIndex % 2 === 0 ? '#F9FAFB' : null)
                    }
                });
            }

            if (exportType === 'tasks') {
                const summaryBody = [
                    [{ text: 'Trạng thái', style: 'tableHeader' }, { text: 'Số lượng', style: 'tableHeader' }],
                    ...Array.from(statusCounts.entries()).map(([name, count]) => [
                        name,
                        { text: String(count), alignment: 'center', bold: true }
                    ]),
                    ['Quá hạn (chưa đóng)', { text: String(overdueTasks), alignment: 'center', bold: true, color: '#EF4444' }],
                    [{ text: 'TỔNG CÔNG VIỆC', bold: true }, { text: String(totalTasks), alignment: 'center', bold: true, color: '#3B82F6' }]
                ];

                docContent.push({ text: ' ', margin: [0, 15, 0, 0] as [number, number, number, number] });
                docContent.push({ text: 'Thống kê tổng quan', style: 'subheader', margin: [0, 0, 0, 8] as [number, number, number, number] });
                docContent.push({
                    table: {
                        headerRows: 1,
                        widths: [200, 100],
                        body: summaryBody
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#E5E7EB',
                        vLineColor: () => '#E5E7EB',
                        fillColor: (rowIndex: number) => rowIndex === 0 ? '#3B82F6' : (rowIndex % 2 === 0 ? '#F9FAFB' : null)
                    }
                });

                if (taskUserStats.size > 0) {
                    const userSummaryBody = [
                        [
                            { text: 'Người thực hiện', style: 'tableHeader' },
                            { text: 'Tổng task', style: 'tableHeader' },
                            { text: 'Hoàn thành', style: 'tableHeader' },
                            { text: 'Hoàn thành (trễ)', style: 'tableHeader' },
                            { text: 'Tỉ lệ hoàn thành', style: 'tableHeader' },
                            { text: 'Quá hạn', style: 'tableHeader' }
                        ],
                        ...Array.from(taskUserStats.entries())
                            .sort((a, b) => b[1].total - a[1].total)
                            .map(([name, stat]) => {
                                const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                                return [
                                    name,
                                    { text: String(stat.total), alignment: 'center' },
                                    { text: String(stat.completed), alignment: 'center', color: '#10B981' },
                                    { text: String(stat.completedLate), alignment: 'center', color: stat.completedLate > 0 ? '#F59E0B' : '#6B7280' },
                                    { text: `${rate}%`, alignment: 'center', bold: true },
                                    { text: String(stat.overdue), alignment: 'center', color: stat.overdue > 0 ? '#EF4444' : '#6B7280' }
                                ];
                            })
                    ];

                    docContent.push({ text: ' ', margin: [0, 15, 0, 0] as [number, number, number, number] });
                    docContent.push({ text: 'Thống kê theo người thực hiện', style: 'subheader', margin: [0, 0, 0, 8] as [number, number, number, number] });
                    docContent.push({
                        table: {
                            headerRows: 1,
                            widths: [150, 70, 80, 100, 100, 70],
                            body: userSummaryBody
                        },
                        layout: {
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#E5E7EB',
                            vLineColor: () => '#E5E7EB',
                            fillColor: (rowIndex: number) => rowIndex === 0 ? '#8B5CF6' : (rowIndex % 2 === 0 ? '#F9FAFB' : null)
                        }
                    });
                }
            }

            // Create PDF document definition
            const docDefinition = {
                pageOrientation: 'landscape' as const,
                pageSize: 'A4' as const,
                pageMargins: [20, 20, 20, 30] as [number, number, number, number],
                content: docContent,
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
            toast.error('Không thể xuất báo cáo. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
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

    const formatDisplayDate = (isoString?: string | null) => {
        if (!isoString) return '...';
        const parts = isoString.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return isoString;
    };

    const isExporting = exportingCSV || exportingPDF;

    if (exportScope === 'NONE') {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/reports" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Xuất báo cáo</h1>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền xuất báo cáo</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Tài khoản của bạn chưa được cấp quyền <strong>Xuất báo cáo</strong>. Liên hệ quản trị viên hệ thống để được cấp quyền phù hợp.
                    </p>
                </div>
            </div>
        );
    }

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
                                disabled={exportScope === 'OWN'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                {exportScope !== 'OWN' && <option value="">Tất cả người dùng</option>}
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
                                {formatDisplayDate(dateRange.startDate)} → {formatDisplayDate(dateRange.endDate)}
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
