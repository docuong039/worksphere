import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-error';

// GET /api/reports/export - Export data as CSV
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'tasks';
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const isAdmin = session.user.isAdministrator;

        // Date filter
        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        let csvContent = '';
        let filename = 'export';

        switch (type) {
            case 'tasks': {
                // Build where clause for tasks
                const where: Record<string, unknown> = {};

                // Project filter
                if (projectId) {
                    where.projectId = projectId;
                } else if (!isAdmin) {
                    // Non-admin: only projects they're member of
                    where.project = { members: { some: { userId: session.user.id } } };
                }

                // User filter (assignee)
                if (userId) {
                    where.assigneeId = userId;
                }

                // Date filter on createdAt or updatedAt
                if (startDate || endDate) {
                    where.createdAt = dateFilter;
                }

                const tasks = await prisma.task.findMany({
                    where,
                    include: {
                        project: { select: { name: true } },
                        tracker: { select: { name: true } },
                        status: { select: { name: true, isClosed: true } },
                        priority: { select: { name: true } },
                        assignee: { select: { name: true } },
                        creator: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                // CSV Header
                csvContent = 'Mã,Tiêu đề,Dự án,Loại,Trạng thái,Độ ưu tiên,Người thực hiện,Người tạo,Tiến độ (%),Thời gian ước lượng (h),Ngày bắt đầu,Ngày hết hạn,Ngày tạo\n';

                // CSV Rows
                tasks.forEach(task => {
                    const startDateStr = task.startDate ? formatDateVN(task.startDate) : '';
                    const dueDateStr = task.dueDate ? formatDateVN(task.dueDate) : '';
                    const createdAtStr = formatDateVN(task.createdAt);

                    csvContent += `${task.number},"${task.title.replace(/"/g, '""')}","${task.project.name}","${task.tracker.name}","${task.status.name}","${task.priority.name}","${task.assignee?.name || ''}","${task.creator.name}",${task.doneRatio},${task.estimatedHours || ''},"${startDateStr}","${dueDateStr}","${createdAtStr}"\n`;
                });

                filename = `cong-viec_${formatDateForFilename(startDate, endDate)}`;
                break;
            }

            case 'time-logs': {
                // TimeLog model không tồn tại trong schema hiện tại
                return errorResponse('Tính năng Time Logs chưa được kích hoạt', 400);
            }

            case 'project-summary': {
                // Project summary export
                const where: Record<string, unknown> = { isArchived: false };

                if (projectId) {
                    where.id = projectId;
                } else if (!isAdmin) {
                    where.members = { some: { userId: session.user.id } };
                }

                const projects = await prisma.project.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        identifier: true,
                        startDate: true,
                        endDate: true,
                        _count: { select: { tasks: true, members: true } },
                        tasks: {
                            select: {
                                status: { select: { isClosed: true } },
                                estimatedHours: true,
                            },
                            where: startDate || endDate ? { createdAt: dateFilter } : undefined,
                        },
                    },
                });

                csvContent = 'Mã định danh,Tên dự án,Thành viên,Tổng task,Task mở,Task đóng,Tiến độ (%),Tổng giờ ước lượng,Ngày bắt đầu,Ngày kết thúc\n';

                projects.forEach(p => {
                    const closedTasks = p.tasks.filter(t => t.status.isClosed).length;
                    const openTasks = p.tasks.length - closedTasks;
                    const progress = p.tasks.length > 0 ? Math.round((closedTasks / p.tasks.length) * 100) : 0;
                    const totalHours = p.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
                    const pStartDate = p.startDate ? formatDateVN(p.startDate) : '';
                    const pEndDate = p.endDate ? formatDateVN(p.endDate) : '';

                    csvContent += `${p.identifier},"${p.name}",${p._count.members},${p.tasks.length},${openTasks},${closedTasks},${progress},${totalHours.toFixed(1)},"${pStartDate}","${pEndDate}"\n`;
                });

                filename = `tong-hop-du-an_${formatDateForFilename(startDate, endDate)}`;
                break;
            }

            case 'user-summary': {
                // User summary export (admin only)
                if (!isAdmin) {
                    return errorResponse('Không có quyền truy cập', 403);
                }

                const userWhere: Record<string, unknown> = { isActive: true };
                if (userId) {
                    userWhere.id = userId;
                }

                const taskDateFilter = startDate || endDate ? { createdAt: dateFilter } : {};
                const projectFilter = projectId ? { projectId } : {};

                const users = await prisma.user.findMany({
                    where: userWhere,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        assignedTasks: {
                            where: { ...taskDateFilter, ...projectFilter },
                            select: {
                                status: { select: { isClosed: true } },
                                estimatedHours: true,
                            },
                        },
                    },
                });

                csvContent = 'Tên,Email,Tổng task được gán,Task mở,Task đóng,Hiệu suất (%),Tổng giờ ước lượng\n';

                users.forEach(u => {
                    const closedTasks = u.assignedTasks.filter(t => t.status.isClosed).length;
                    const openTasks = u.assignedTasks.length - closedTasks;
                    const perf = u.assignedTasks.length > 0 ? Math.round((closedTasks / u.assignedTasks.length) * 100) : 0;
                    const totalHours = u.assignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

                    csvContent += `"${u.name}","${u.email}",${u.assignedTasks.length},${openTasks},${closedTasks},${perf},${totalHours.toFixed(1)}\n`;
                });

                filename = `tong-hop-nhan-su_${formatDateForFilename(startDate, endDate)}`;
                break;
            }

            default:
                return errorResponse('Loại export không hợp lệ', 400);
        }

        // Return CSV response
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

        return new Response(blob, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}.csv"`,
            },
        });

    } catch (error) {
        console.error('Export error:', error);
        return errorResponse('Lỗi khi xuất dữ liệu', 500);
    }
}

function formatDateForFilename(startDate: string | null, endDate: string | null): string {
    if (startDate && endDate) {
        return `${startDate}_${endDate}`;
    } else if (startDate) {
        return `from_${startDate}`;
    } else if (endDate) {
        return `to_${endDate}`;
    }
    return new Date().toISOString().split('T')[0];
}

// Format date as yyyy-mm-dd (ISO format) to avoid Excel misinterpretation
function formatDateVN(date: Date | string | null | undefined): string {
    if (!date) return '';

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        // Use ISO format yyyy-mm-dd to avoid Excel locale issues
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
}
