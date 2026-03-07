import prisma from '@/lib/prisma';
import { errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/modules/project/project.policy';
import * as TaskPolicy from '@/modules/task/task.policy';
import { ReportPolicy } from '@/modules/report/report.policy';


// GET /api/reports/export - Export data as CSV
export const GET = withAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'tasks';
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const isAdmin = user.isAdministrator;

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
            const where: Record<string, unknown> = {};

            if (projectId) {
                const perms = await getUserPermissions(user.id, projectId);
                if (!ProjectPolicy.canViewProject(user, perms)) {
                    return errorResponse('Không có quyền xuất dữ liệu cho dự án này', 403);
                }
                where.projectId = projectId;
            } else if (!user.isAdministrator) {
                where.project = { members: { some: { userId: user.id } } };
                // Filter private tasks
                where.OR = [
                    { isPrivate: false },
                    { creatorId: user.id },
                    { assigneeId: user.id }
                ];
            }


            const globalPerms = await getUserPermissions(user.id);
            if (userId) {
                if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF' && userId !== user.id) {
                    return errorResponse('Không có quyền xuất dữ liệu của người khác', 403);
                }
                where.assigneeId = userId;
            } else if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF') {
                where.assigneeId = user.id; // Tự động khóa dữ liệu của bản thân nếu không có quyền xem người khác
            }

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

            csvContent = 'Mã,Tiêu đề,Dự án,Loại,Trạng thái,Độ ưu tiên,Người thực hiện,Người tạo,Tiến độ (%),Thời gian ước lượng (h),Ngày bắt đầu,Ngày hết hạn,Ngày tạo\n';

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
            const globalPerms = await getUserPermissions(user.id);
            if (!ReportPolicy.canViewTimeReports(user, globalPerms)) {
                return errorResponse('Không có quyền nâng cao để xuất báo cáo thời gian', 403);
            }

            const where: Record<string, unknown> = {};

            if (startDate || endDate) {
                where.spentOn = dateFilter;
            }

            if (projectId) {
                const perms = await getUserPermissions(user.id, projectId);
                if (!ProjectPolicy.canViewProject(user, perms)) {
                    return errorResponse('Không có quyền xuất dữ liệu cho dự án này', 403);
                }
                where.projectId = projectId;
            } else if (!user.isAdministrator) {
                where.project = { members: { some: { userId: user.id } } };
            }


            if (userId) {
                if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF' && userId !== user.id) {
                    return errorResponse('Không có quyền xuất dữ liệu của người khác', 403);
                }
                where.userId = userId;
            } else if (!user.isAdministrator && ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) === 'SELF') {
                where.userId = user.id; // Tự động khóa dữ liệu của bản thân nếu không có quyền cao
            }

            const timeLogs = await prisma.timeLog.findMany({
                where,
                include: {
                    project: { select: { name: true } },
                    task: { select: { title: true, number: true } },
                    user: { select: { name: true, email: true } },
                    activity: { select: { name: true } },
                },
                orderBy: { spentOn: 'desc' },
            });

            csvContent = 'Ngày,Người thực hiện,Dự án,Tên công việc,Hoạt động,Giờ,Mô tả\n';

            timeLogs.forEach(log => {
                const spentOnStr = formatDateVN(log.spentOn);
                const taskTitle = log.task ? `#${log.task.number} ${log.task.title}` : '-';
                const comments = log.comments ? log.comments.replace(/"/g, '""') : '';

                csvContent += `"${spentOnStr}","${log.user.name}","${log.project.name}","${taskTitle.replace(/"/g, '""')}","${log.activity.name}",${log.hours},"${comments}"\n`;
            });

            filename = `thoi-gian_${formatDateForFilename(startDate, endDate)}`;
            break;
        }

        case 'project-summary': {
            const where: Record<string, unknown> = { isArchived: false };

            if (projectId) {
                const perms = await getUserPermissions(user.id, projectId);
                if (!ProjectPolicy.canViewProject(user, perms)) {
                    return errorResponse('Không có quyền xuất dữ liệu cho dự án này', 403);
                }
                where.id = projectId;
            } else if (!user.isAdministrator) {
                where.members = { some: { userId: user.id } };
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
            const globalPerms = await getUserPermissions(user.id);
            if (ReportPolicy.getPersonnelVisibilityScope(user, globalPerms) !== 'ALL') {
                return errorResponse('Không có quyền nâng cao để xuất báo cáo người dùng', 403);
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
});

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
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
}
