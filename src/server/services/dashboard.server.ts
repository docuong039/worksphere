import prisma from '@/lib/prisma';
import * as DashboardPolicy from '@/server/policies/dashboard.policy';
import { SessionUser } from '@/types';

export class DashboardServerService {
    static async getDashboardData(user: SessionUser, selectedProjectId?: string) {
        const userId = user.id;
        const isAdmin = user.isAdministrator;

        // 1. Fetch Projects for visibility & managerial check
        const projects = await prisma.project.findMany({
            where: isAdmin ? { isArchived: false } : {
                isArchived: false,
                members: { some: { userId } }
            },
            include: {
                _count: { select: { tasks: true, members: true } },
                tasks: {
                    where: { status: { isClosed: false } },
                    select: { id: true, dueDate: true, assigneeId: true, priority: { select: { position: true } } }
                },
                creator: { select: { name: true } },
                members: {
                    // Include roles and permissions for DashboardPolicy to check managerial rights
                    include: {
                        role: {
                            include: {
                                permissions: { include: { permission: true } }
                            }
                        },
                        user: { select: { isAdministrator: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });

        // 2. Determine View Mode & Managed Projects using Policy
        type ProjectData = (typeof projects)[0];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isManagerView = DashboardPolicy.shouldShowManagementView(user as any, projects as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const managedProjects = DashboardPolicy.filterManagedProjects(user as any, projects as any);

        // 3. Calculate Stats for Manager (if applicable)
        const baseProjects = isManagerView ? managedProjects : projects;
        const displayProjects = selectedProjectId
            ? baseProjects.filter((p: any) => (p as ProjectData).id === selectedProjectId)
            : baseProjects;

        // Lọc managedProjects nếu có selectedProjectId
        const filterProjects = selectedProjectId
            ? managedProjects.filter((p: any) => (p as ProjectData).id === selectedProjectId)
            : managedProjects;

        // Lấy thông tin độ ưu tiên mặc định (Sử dụng chung cho cả Manager và Employee)
        const defaultPriority = await prisma.priority.findFirst({ where: { isDefault: true } });
        const normalPosition = defaultPriority?.position ?? 2;

        const managerStats = {
            totalProjects: filterProjects.length,
            totalOverdue: filterProjects.reduce((sum: number, p: any) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sum + (p as any).tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date()).length, 0),
            // Đếm unique thành viên — loại trừ administrator, tránh đếm trùng người tham gia nhiều dự án
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalMembers: new Set(filterProjects.flatMap((p: any) => (p as any).members.filter((m: any) => !m.user.isAdministrator).map((m: any) => m.userId))).size,
            totalUrgent: filterProjects.reduce((sum: number, p: any) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sum + (p as any).tasks.filter((t: any) => t.priority && t.priority.position > normalPosition).length, 0)
        };

        // 3. Tính toán Thống kê cho Nhân viên (Cá nhân)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const assigneeFilter: any = { assigneeId: userId, status: { isClosed: false } };
        if (selectedProjectId) {
            assigneeFilter.projectId = selectedProjectId;
        }

        const myTasks = await prisma.task.findMany({
            where: assigneeFilter,
            include: {
                project: { select: { name: true } },
                priority: { select: { name: true, color: true } }
            },
            orderBy: { dueDate: 'asc' },
            take: 5
        });

        // Lấy ngày mốc 'hôm nay'
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [myOverdueCount, myHighPriorityCount, myTodayCount] = await Promise.all([
            prisma.task.count({
                where: {
                    ...assigneeFilter,
                    dueDate: { lt: new Date() }
                }
            }),
            prisma.task.count({
                where: {
                    ...assigneeFilter,
                    priority: { position: { gt: normalPosition } } // Bất kỳ cái gì cao hơn "Bình thường"
                }
            }),
            prisma.task.count({
                where: {
                    ...assigneeFilter,
                    dueDate: { gte: todayStart, lte: todayEnd }
                }
            })
        ]);

        // Fetch critical tasks for Manager
        const criticalTasks = isManagerView ? await prisma.task.findMany({
            where: {
                status: { isClosed: false },
                projectId: { in: filterProjects.map((p: any) => (p as ProjectData).id) },
                dueDate: { lt: new Date() }
            },
            include: {
                project: { select: { name: true } },
                priority: { select: { name: true, color: true } }
            },
            orderBy: [
                { priority: { position: 'desc' } },
                { dueDate: 'asc' }
            ],
            take: 8
        }) : [];

        // 4. Activity Trend (Scope-aware)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Filter tasks based on accessibility (Security first!)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trendFilter: any = {
            status: { isClosed: true },
            updatedAt: { gte: sevenDaysAgo }
        };

        if (selectedProjectId) {
            trendFilter.projectId = selectedProjectId;
            if (!isAdmin && !isManagerView) {
                trendFilter.assigneeId = userId;
            }
        } else if (!isAdmin) {
            if (isManagerView) {
                // Manager thấy hoạt động của các dự án mình tham gia
                trendFilter.projectId = { in: projects.map(p => p.id) };
            } else {
                // Nhân viên chỉ thấy xu hướng của chính mình
                trendFilter.assigneeId = userId;
            }
        }

        const closedTasksRaw = await prisma.task.findMany({
            where: trendFilter,
            select: { updatedAt: true }
        });

        const trendData = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'short' });
            const count = closedTasksRaw.filter(t => {
                const upDate = new Date(t.updatedAt);
                upDate.setHours(0, 0, 0, 0);
                return upDate.getTime() === d.getTime();
            }).length;
            return { name: dateStr, count };
        }).reverse();

        return {
            isAdmin,
            isManagerView,
            projects,
            managedProjects,
            displayProjects,
            managerStats,
            myTasks,
            myOverdueCount,
            myHighPriorityCount,
            myTodayCount,
            criticalTasks,
            trendData,
        };
    }
}
