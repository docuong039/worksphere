import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
    Briefcase,
    CheckSquare,
    ArrowRight,
    Users,
    Clock,
    Target,
    Zap,
    TrendingUp,
    AlertTriangle,
    Calendar,
} from 'lucide-react';
import * as DashboardPolicy from '@/modules/dashboard/dashboard.policy';
import ActivityChart from '@/components/charts/ActivityChart';
import { DashboardFilter } from '@/components/dashboard/dashboard-filter';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await auth();
    if (!session || !session.user) return null;

    const userId = session.user.id;
    const isAdmin = session.user.isAdministrator;

    const params = await searchParams;
    const selectedProjectId = params?.projectId as string | undefined;

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
    const isManagerView = DashboardPolicy.shouldShowManagementView(session.user as any, projects as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const managedProjects = DashboardPolicy.filterManagedProjects(session.user as any, projects as any);

    // 3. Calculate Stats for Manager (if applicable)
    const baseProjects = isManagerView ? managedProjects : projects;
    const displayProjects = selectedProjectId
        ? baseProjects.filter((p) => (p as ProjectData).id === selectedProjectId)
        : baseProjects;

    // Lọc managedProjects nếu có selectedProjectId
    const filterProjects = selectedProjectId
        ? managedProjects.filter(p => (p as ProjectData).id === selectedProjectId)
        : managedProjects;

    // Lấy thông tin độ ưu tiên mặc định (Sử dụng chung cho cả Manager và Employee)
    const defaultPriority = await prisma.priority.findFirst({ where: { isDefault: true } });
    const normalPosition = defaultPriority?.position ?? 2;

    const managerStats = {
        totalProjects: filterProjects.length,
        totalOverdue: filterProjects.reduce((sum, p) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sum + (p as any).tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date()).length, 0),
        // Đếm unique thành viên — loại trừ administrator, tránh đếm trùng người tham gia nhiều dự án
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalMembers: new Set(filterProjects.flatMap(p => (p as any).members.filter((m: any) => !m.user.isAdministrator).map((m: any) => m.userId))).size,
        totalUrgent: filterProjects.reduce((sum, p) =>
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
            projectId: { in: filterProjects.map(p => (p as ProjectData).id) },
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

    return (
        <div className="space-y-8 pb-10">
            {/* Header Duy nhất & Sạch sẽ */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {isManagerView ? 'Bảng điều hành dự án' : 'Không gian làm việc'}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        {isManagerView
                            ? `Chào ${session.user.name}, đây là tổng quan tình hình các dự án bạn quản lý.`
                            : `Chào ${session.user.name}, chúc bạn một ngày làm việc hiệu quả.`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <DashboardFilter projects={isManagerView ? managedProjects as ProjectData[] : projects} />
                </div>
            </div>

            {/* PHẦN 1: BỘ THẺ THỐNG KÊ (HIỂN THỊ THEO QUYỀN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isManagerView ? (
                    // VIEW QUẢN LÝ: Tập trung vào "Vận hành dự án"
                    <>
                        <StatCard icon={<Briefcase />} label="Dự án quản lý" value={managerStats.totalProjects} color="blue" />
                        <StatCard icon={<Clock />} label="Việc trễ hạn" value={managerStats.totalOverdue} color="red" />
                        <StatCard icon={<Users />} label="Tổng thành viên" value={managerStats.totalMembers} color="green" />
                        <StatCard icon={<AlertTriangle />} label="Việc cấp bách" value={managerStats.totalUrgent} color="purple" highlight={managerStats.totalUrgent > 0} />
                    </>
                ) : (
                    // VIEW NHÂN VIÊN: Tập trung vào "Năng suất cá nhân"
                    <>
                        <StatCard icon={<CheckSquare />} label="Việc cần làm" value={myTasks.length} color="blue" />
                        <StatCard icon={<Clock />} label="Việc đã quá hạn" value={myOverdueCount} color="red" highlight={myOverdueCount > 0} />
                        <StatCard icon={<Zap />} label="Ưu tiên cao" value={myHighPriorityCount} color="orange" highlight={myHighPriorityCount > 0} />
                        <StatCard icon={<Calendar />} label="Deadline hôm nay" value={myTodayCount} color="green" highlight={myTodayCount > 0} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CỘT TRÁI: DANH SÁCH DỰ ÁN (HIỆN CHO CẢ 2 NHƯNG NỘI DUNG LỌC KHÁC NHAU) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Xu hướng hoạt động */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[350px]">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                {isManagerView || isAdmin ? 'Xu hướng hoạt động (Team)' : 'Hiệu suất cá nhân (7 ngày qua)'}
                            </h2>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                                {isManagerView || isAdmin ? 'Số việc team hoàn thành' : 'Số việc bạn đã xong'}
                            </span>
                        </div>
                        <div className="p-6">
                            <ActivityChart data={trendData} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                {isManagerView ? 'Sức khỏe dự án quản lý' : 'Dự án đang tham gia'}
                            </h2>
                            <Link href="/projects" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                                Xem tất cả <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {displayProjects.slice(0, 6).map((proj) => {
                                const p = proj as ProjectData;
                                const total = p._count?.tasks ?? 0;
                                const open = p.tasks?.length ?? 0;
                                const rate = total > 0 ? Math.round(((total - open) / total) * 100) : 0;
                                return (
                                    <div key={p.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/projects/${p.id}`} className="font-bold text-gray-900 text-[15px] hover:text-blue-600 transition-colors truncate block mb-1">
                                                    {p.name}
                                                </Link>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>Bởi {p.creator?.name ?? 'Admin'}</span>
                                                    <span>•</span>
                                                    <span className="text-gray-900">{p._count?.members ?? 0} thành viên</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="hidden md:block w-32">
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rate}%` }} />
                                                    </div>
                                                </div>
                                                <div className="text-right min-w-[45px]">
                                                    <div className="text-sm font-bold text-gray-900">{rate}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: CHI TIẾT ĐIỂM NÓNG / CÔNG VIỆC CỦA TÔI */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                {isManagerView ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Target className="w-4 h-4 text-blue-600" />}
                                {isManagerView ? 'Công việc quá hạn' : 'Công việc của tôi'}
                            </h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {isManagerView ? (
                                criticalTasks.length > 0 ? criticalTasks.map((task: any) => (
                                    <Link key={task.id} href={`/tasks/${task.id}`} className="block p-3 rounded-xl hover:bg-red-50/50 transition-all group">
                                        <div className="text-[13px] font-bold text-gray-800 group-hover:text-red-600 mb-1 transition-colors">{task.title}</div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.priority.color || '#ccc' }} />
                                                {task.project.name}
                                            </div>
                                            {task.dueDate && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-600">
                                                    Quá hạn
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="p-8 pb-10 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                                            <CheckSquare className="w-6 h-6 text-green-500" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">Mọi thứ đang ổn định</p>
                                        <p className="text-xs text-gray-500 font-medium">Không có công việc nào bị trễ hạn</p>
                                    </div>
                                )
                            ) : (
                                myTasks.length > 0 ? myTasks.map((task: any) => (
                                    <Link key={task.id} href={`/tasks/${task.id}`} className="block p-3 rounded-xl hover:bg-gray-50 transition-all group">
                                        <div className="text-[13px] font-bold text-gray-800 group-hover:text-blue-600 mb-1 transition-colors line-clamp-2">{task.title}</div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.priority.color || '#ccc' }} />
                                                <span className="truncate">{task.project.name}</span>
                                            </div>
                                            {task.dueDate && (
                                                <span className={`shrink-0 text-[10px] font-bold ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="p-8 text-center text-xs text-gray-500 font-medium">Bạn đã hoàn thành hết việc!</div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: 'blue' | 'red' | 'orange' | 'purple' | 'green';
    highlight?: boolean;
}

// Sub-component cho thẻ thống kê (Sạch sẽ & Tái sử dụng)
function StatCard({ icon, label, value, color }: StatCardProps) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-emerald-50 text-emerald-600'
    };
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {icon && <div className="w-5 h-5">{icon}</div>}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
            </div>
        </div>
    );
}
