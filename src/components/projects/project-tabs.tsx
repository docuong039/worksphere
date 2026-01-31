'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Map, ListTodo, Users, Clock, Flag } from 'lucide-react';

interface ProjectTabsProps {
    projectId: string;
    className?: string;
}

export function ProjectTabs({ projectId, className = '' }: ProjectTabsProps) {
    const pathname = usePathname();

    const tabs = [
        { id: 'overview', label: 'Tổng quan', href: `/projects/${projectId}`, icon: LayoutDashboard, exact: true },
        { id: 'activity', label: 'Hoạt động', href: `/projects/${projectId}/activity`, icon: Activity },
        { id: 'roadmap', label: 'Roadmap', href: `/projects/${projectId}/roadmap`, icon: Map },
        { id: 'tasks', label: 'Công việc', href: `/projects/${projectId}/tasks`, icon: ListTodo },
        { id: 'time-entries', label: 'Thời gian', href: `/projects/${projectId}/time-entries`, icon: Clock },
        { id: 'members', label: 'Thành viên', href: `/projects/${projectId}/members`, icon: Users },
        { id: 'versions', label: 'Phiên bản', href: `/projects/${projectId}/versions`, icon: Flag },
    ];

    return (
        <div className={`flex items-center border-b border-gray-200 mb-6 overflow-x-auto ${className}`}>
            {tabs.map((tab) => {
                const isActive = tab.exact
                    ? pathname === tab.href
                    : pathname.startsWith(tab.href);

                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
