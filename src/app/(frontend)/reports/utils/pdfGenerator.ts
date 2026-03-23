import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Kích hoạt font tiếng Việt
pdfMake.vfs = pdfFonts.vfs;

export interface ProjectOption {
    id: string;
    name: string;
}

export interface UserOption {
    id: string;
    name: string;
}

export interface TaskData {
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

export interface TimeLogData {
    id: string;
    hours: number;
    comments: string | null;
    spentOn: string;
    project: { name: string };
    user: { name: string };
    activity: { name: string };
    task: { title: string; number: number; estimatedHours?: number; dueDate?: string | null; updatedAt?: string; status?: { isClosed: boolean }; timeLogs?: { hours: number }[] } | null;
}

export interface GeneratePDFParams {
    exportType: 'tasks' | 'time';
    dateRange: { startDate: string; endDate: string };
    selectedProjectId: string;
    selectedUserId: string;
    projects: ProjectOption[];
    users: UserOption[];
}

export const generatePDF = async (params: GeneratePDFParams) => {
    const { exportType, dateRange, selectedProjectId, selectedUserId, projects, users } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('pageSize', '5000'); // Lấy dữ liệu siêu to để làm export
    queryParams.set('forExport', 'true');
    if (selectedProjectId) queryParams.set('projectId', selectedProjectId);

    if (exportType === 'tasks') {
        if (dateRange.startDate) queryParams.set('createdAtFrom', dateRange.startDate);
        if (dateRange.endDate) queryParams.set('createdAtTo', dateRange.endDate);
        if (selectedUserId) queryParams.set('assigneeId', selectedUserId);
    } else {
        if (dateRange.startDate) queryParams.set('from', dateRange.startDate);
        if (dateRange.endDate) queryParams.set('to', dateRange.endDate);
        if (selectedUserId) queryParams.set('userId', selectedUserId);
    }

    let tableHeaders: any[] = [];
    let tableBody: any[] = [];
    let userSummaries = new Map<string, { totalAct: number; taskMap: Map<number, { est: number; isClosed: boolean; isOnTime: boolean }> }>();

    let totalTasks = 0;
    let overdueTasks = 0;
    const statusCounts = new Map<string, number>();
    const taskUserStats = new Map<string, { total: number, completed: number, completedLate: number, overdue: number }>();

    let title = '';

    // ==========================================
    // LẤY VÀ MAP DATA TASK
    // ==========================================
    if (exportType === 'tasks') {
        const res = await fetch(`/api/tasks?${queryParams.toString()}`);
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
        // ==========================================
        // LẤY VÀ MAP DATA TIME-LOGS
        // ==========================================
        const res = await fetch(`/api/time-logs?${queryParams.toString()}`);
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
            { text: 'Giờ dự kiến', style: 'tableHeader' },
            { text: 'Giờ thực tế', style: 'tableHeader' },
            { text: 'Đánh giá', style: 'tableHeader' },
            { text: 'Ghi chú', style: 'tableHeader' }
        ];

        let totalHours = 0;
        tableBody = logs.map(log => {
            totalHours += log.hours;

            let s = userSummaries.get(log.user.name);
            if (!s) {
                s = { totalAct: 0, taskMap: new Map() };
                userSummaries.set(log.user.name, s);
            }
            s.totalAct += log.hours;

            let est = 0;
            let evalStatus: any = { text: '-', color: 'black' };

            if (log.task) {
                est = log.task.estimatedHours || 0;
                const totalActual = log.task.timeLogs?.reduce((sum: number, t: any) => sum + t.hours, 0) || 0;

                if (!s.taskMap.has(log.task.number)) {
                    const isClosed = log.task.status?.isClosed || false;
                    let isOnTime = false;
                    if (isClosed) {
                        if (!log.task.dueDate) isOnTime = true;
                        else if (new Date(log.task.updatedAt || new Date().toISOString()) <= new Date(log.task.dueDate)) isOnTime = true;
                    }
                    s.taskMap.set(log.task.number, { est, isClosed, isOnTime });
                }

                if (est > 0) {
                    if (totalActual > est) {
                        evalStatus = { text: `Vượt ${(totalActual - est).toFixed(1)}h`, color: '#EF4444' };
                    } else {
                        evalStatus = { text: `Dư ${(est - totalActual).toFixed(1)}h`, color: '#10B981' };
                    }
                } else {
                    evalStatus = { text: 'Chưa thiết lập kế hoạch', color: '#6B7280' };
                }
            }

            return [
                { text: new Date(log.spentOn).toLocaleDateString('vi-VN'), alignment: 'center' },
                log.user.name,
                log.project.name,
                log.task ? `#${log.task.number} ${log.task.title}` : '-',
                log.activity.name,
                { text: est > 0 ? String(est) : '-', alignment: 'center' },
                { text: String(log.hours), alignment: 'center' },
                evalStatus,
                log.comments || ''
            ];
        });

        tableBody.push([
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { text: 'TỔNG:', alignment: 'right', bold: true },
            { text: String(Number(totalHours.toFixed(1))), alignment: 'center', bold: true, color: 'blue' },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] }
        ]);
    }

    // ==========================================
    // PHẦN THỐNG KÊ (SUMMARY) BÊN DƯỚI BẢNG
    // ==========================================
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
                    : [55, 60, 60, '*', 50, 30, 25, 55, 60],
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

    if (exportType === 'time' && userSummaries.size > 0) {
        const summaryBody: any[] = [
            [
                { text: 'Nhân sự', style: 'tableHeader' },
                { text: 'Tổng giờ dự kiến', style: 'tableHeader' },
                { text: 'Tổng giờ thực tế', style: 'tableHeader' },
                { text: 'Chênh lệch (giờ)', style: 'tableHeader' },
                { text: 'Hiệu suất (%)', style: 'tableHeader' },
                { text: 'Xếp loại', style: 'tableHeader' }
            ]
        ];

        Array.from(userSummaries.entries()).forEach(([name, s]) => {
            const est = Array.from(s.taskMap.values()).reduce((sum, t) => sum + t.est, 0);
            const act = s.totalAct;
            const diff = act - est;
            const perf = est > 0 ? (est / act) * 100 : 0;

            let rating = 'Yếu';
            let ratingColor = '#EF4444';
            if (est === 0) {
                rating = 'Chưa có kế hoạch';
                ratingColor = '#6B7280';
            } else if (perf >= 100) {
                rating = 'Xuất sắc';
                ratingColor = '#10B981';
            } else if (perf >= 90) {
                rating = 'Tốt';
                ratingColor = '#3B82F6';
            } else if (perf >= 75) {
                rating = 'Cần cải thiện';
                ratingColor = '#F59E0B';
            }

            summaryBody.push([
                name,
                { text: est > 0 ? est.toFixed(1) : '-', alignment: 'center' },
                { text: act.toFixed(1), alignment: 'center', bold: true },
                { text: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1), alignment: 'center', color: diff > 0 ? '#EF4444' : '#10B981' },
                { text: perf > 0 ? `${perf.toFixed(0)}%` : '-', alignment: 'center' },
                { text: rating, alignment: 'center', color: ratingColor, bold: true }
            ]);
        });

        docContent.push({ text: ' ', margin: [0, 15, 0, 0] as [number, number, number, number] });
        docContent.push({ text: 'Tổng hợp hiệu suất giờ theo nhân sự', style: 'subheader', margin: [0, 0, 0, 8] as [number, number, number, number] });
        docContent.push({
            table: {
                headerRows: 1,
                widths: ['*', 70, 70, 75, 75, 80],
                body: summaryBody
            },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#E5E7EB',
                vLineColor: () => '#E5E7EB',
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#E0F2FE' : (rowIndex % 2 === 0 ? '#F9FAFB' : null)
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

    // ==========================================
    // KHUNG GIẤY VÀ IN
    // ==========================================
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

    pdfMake.createPdf(docDefinition).download(`${exportType === 'tasks' ? 'cong-viec' : 'thoi-gian'}_${new Date().toISOString().split('T')[0]}.pdf`);
};
