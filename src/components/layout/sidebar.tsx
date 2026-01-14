'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderKanban,
    ListTodo,
    Clock,
    Users,
    Shield,
    Tag,
    Activity,
    GitBranch,
    BarChart3,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface SidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        isAdministrator: boolean;
    };
}

const mainMenu = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Dự án', icon: FolderKanban },
    { href: '/tasks', label: 'Công việc', icon: ListTodo },
    { href: '/time-logs', label: 'Thời gian', icon: Clock },
    { href: '/activity', label: 'Hoạt động', icon: Activity },
    { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
];

const adminMenu = [
    { href: '/settings/trackers', label: 'Trackers', icon: Tag },
    { href: '/settings/statuses', label: 'Statuses', icon: Activity },
    { href: '/settings/priorities', label: 'Priorities', icon: GitBranch },
    { href: '/settings/workflow', label: 'Workflow', icon: GitBranch },
    { href: '/settings/roles', label: 'Vai trò', icon: Shield },
    { href: '/settings/users', label: 'Người dùng', icon: Users },
];

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted] = useState(() => typeof window !== 'undefined');

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            const collapsed = saved === 'true';
            setTimeout(() => {
                setIsCollapsed(collapsed);
            }, 0);
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    if (!isMounted) return <aside className="w-64 bg-white border-r border-gray-200 flex flex-col" />;

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative group`}>
            {/* Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-50 text-gray-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Logo */}
            <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 overflow-hidden`}>
                <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">W</span>
                    </div>
                    {!isCollapsed && (
                        <span className="font-semibold text-gray-900">WorkSphere</span>
                    )}
                </Link>
            </div>

            {/* Main Menu */}
            <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none`}>
                {!isCollapsed && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 mb-3">
                        Menu chính
                    </p>
                )}
                {mainMenu.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.label : undefined}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive(item.href)
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon className={`${isActive(item.href) ? 'w-5 h-5' : 'w-5 h-5 opacity-70'} shrink-0`} />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}

                {/* Admin Menu */}
                {user.isAdministrator && (
                    <>
                        {!isCollapsed && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 mt-8 mb-3 text-nowrap">
                                Quản trị hệ thống
                            </p>
                        )}
                        {isCollapsed && <div className="h-px bg-gray-100 my-4 mx-2" />}
                        {adminMenu.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive(item.href)
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className={`${isActive(item.href) ? 'w-5 h-5' : 'w-5 h-5 opacity-70'} shrink-0`} />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User Info */}
            <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 bg-gray-50/30`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-1.5 rounded-xl hover:bg-white hover:shadow-sm transition-all`}>
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                        <span className="text-gray-600 text-sm font-bold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[10px] font-medium text-gray-500 truncate">{user.email}</p>
                        </div>
                    )}
                </div>
                {!isCollapsed && user.isAdministrator && (
                    <div className="mt-3 px-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-red-50 text-red-600 uppercase tracking-widest border border-red-100">
                            Admin Access
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
}
