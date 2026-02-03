'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationBell } from '@/components/layout/notification-bell';

interface HeaderProps {
    user: {
        name?: string | null;
        email?: string | null;
        isAdministrator: boolean;
    };
}

export function Header({ user }: HeaderProps) {
    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
                <GlobalSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Xin chào, <strong>{user.name}</strong></span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </header>
    );
}

