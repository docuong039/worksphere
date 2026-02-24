import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
    Briefcase,
    CheckSquare,
    ArrowRight,
    AlertCircle,
    Users,
    Activity,
    Clock,
    Calendar,
    Target,
    Zap,
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/constants';
import * as DashboardPolicy from '@/modules/dashboard/dashboard.policy';

export default async function DashboardPage() {
    const session = await auth();
    if (!session || !session.user) return null;

    const userId = session.user.id;
    const isAdmin = session.user.isAdministrator;

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
                select: { id: true, dueDate: true, assigneeId: true }
            },
            creator: { select: { name: true } },
            members: {
                // Include roles and permissions for DashboardPolicy to check managerial rights
                include: {
                    role: {
                        include: {
                            permissions: { include: { permission: true } }
                        }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' },
    });

    // 2. Determine View Mode & Managed Projects using Policy
    const isManagerView = DashboardPolicy.shouldShowManagementView(session.user as any, projects as any);
    const managedProjects = DashboardPolicy.filterManagedProjects(session.user as any, projects as any);

    // 3. Calculate Stats for Manager (if applicable)
    const managerStats = {
        totalProjects: managedProjects.length,
        totalOverdue: managedProjects.reduce((sum, p) =>
            sum + (p as any).tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date()).length, 0),
        totalUnassigned: managedProjects.reduce((sum, p) =>
            sum + (p as any).tasks.filter((t: any) => !t.assigneeId).length, 0),
        upcomingEndCount: managedProjects.filter((p: any) =>
            p.endDate && new Date(p.endDate) >= new Date() &&
            new Date(p.endDate) <= new Date(new Date().setDate(new Date().getDate() + 7))
        ).length
    };

    // 3. Tính toán Thống kê cho Nhân viên (Cá nhân)
    const myTasks = await prisma.task.findMany({
        where: { assigneeId: userId, status: { isClosed: false } },
        include: {
            project: { select: { name: true } },
            priority: { select: { name: true, color: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
    });

    // Tìm vị trí của độ ưu tiên mặc định (thường là "Bình thường")
    const defaultPriority = await prisma.priority.findFirst({ where: { isDefault: true } });
    const normalPosition = defaultPriority?.position ?? 2;

    const [myOverdueCount, myHighPriorityCount] = await Promise.all([
        prisma.task.count({
            where: {
                assigneeId: userId,
                status: { isClosed: false },
                dueDate: { lt: new Date() }
            }
        }),
        prisma.task.count({
            where: {
                assigneeId: userId,
                status: { isClosed: false },
                priority: { position: { gt: normalPosition } } // Bất kỳ cái gì cao hơn "Bình thường"
            }
        })
    ]);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Duy nhất & Sạch sẽ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                {!isManagerView && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 italic text-xs font-semibold">
                        <Zap className="w-4 h-4" /> Đang tham gia {projects.length} dự án
                    </div>
                )}
            </div>

            {/* PHẦN 1: BỘ THẺ THỐNG KÊ (HIỂN THỊ THEO QUYỀN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isManagerView ? (
                    // VIEW QUẢN LÝ: Tập trung vào "Vận hành dự án"
                    <>
                        <StatCard icon={<Briefcase />} label="Dự án quản lý" value={managerStats.totalProjects} color="blue" />
                        <StatCard icon={<Clock />} label="Việc trễ hạn" value={managerStats.totalOverdue} color="red" />
                        <StatCard icon={<Users />} label="Việc chưa gán" value={managerStats.totalUnassigned} color="orange" />
                        <StatCard icon={<Calendar />} label="Dự án sắp đến hạn" value={managerStats.upcomingEndCount} color="purple" />
                    </>
                ) : (
                    // VIEW NHÂN VIÊN: Tập trung vào "Năng suất cá nhân"
                    <>
                        <StatCard icon={<CheckSquare />} label="Việc cần làm" value={myTasks.length} color="blue" />
                        <StatCard icon={<Clock />} label="Việc đã quá hạn" value={myOverdueCount} color="red" highlight={myOverdueCount > 0} />
                        <StatCard icon={<Zap />} label="Ưu tiên cao" value={myHighPriorityCount} color="orange" highlight={myHighPriorityCount > 0} />
                        <StatCard icon={<Target />} label="Đã hoàn thành" value="--" color="green" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CỘT TRÁI: DANH SÁCH DỰ ÁN (HIỆN CHO CẢ 2 NHƯNG NỘI DUNG LỌC KHÁC NHAU) */}
                <div className="lg:col-span-2 space-y-6">
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
                            {(isManagerView ? managedProjects : projects).slice(0, 6).map((proj: any) => {
                                const total = proj._count?.tasks ?? 0;
                                const open = proj.tasks?.length ?? 0;
                                const rate = total > 0 ? Math.round(((total - open) / total) * 100) : 0;
                                return (
                                    <div key={proj.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/projects/${proj.id}`} className="font-bold text-gray-900 text-[15px] hover:text-blue-600 transition-colors truncate block mb-1">
                                                    {proj.name}
                                                </Link>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>Bởi {proj.creator?.name ?? 'Admin'}</span>
                                                    <span>•</span>
                                                    <span className="text-gray-900">{proj._count?.members ?? 0} thành viên</span>
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

                {/* CỘT PHẢI: CHI TIẾT CÔNG VIỆC CỦA TÔI */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600" />
                                Công việc của tôi
                            </h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {myTasks.length > 0 ? myTasks.map(task => (
                                <Link key={task.id} href={`/tasks/${task.id}`} className="block p-3 rounded-xl hover:bg-gray-50 transition-all group">
                                    <div className="text-[13px] font-bold text-gray-800 group-hover:text-blue-600 mb-1 transition-colors">{task.title}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.priority.color || '#ccc' }} />
                                            {task.project.name}
                                        </div>
                                        {task.dueDate && (
                                            <span className={`text-[10px] font-bold ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            )) : (
                                <div className="p-8 text-center text-xs text-gray-500 font-medium">Bạn đã hoàn thành hết việc!</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component cho thẻ thống kê (Sạch sẽ & Tái sử dụng)
function StatCard({ icon, label, value, color }: any) {
    const colors: any = {
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
