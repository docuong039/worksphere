'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, ChevronDown, User, Mail, ShieldCheck } from 'lucide-react';
import { GlobalSearch } from '@/components/Layout/GlobalSearch';
import { NotificationBell } from '@/components/Layout/NotificationBell';

interface HeaderProps {
    user: {
        id?: string;
        name?: string | null;
        email?: string | null;
        isAdministrator: boolean;
    };
}

export function Header({ user }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await signOut({ redirect: false });
        window.location.href = '/login';
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6">
            {/* Search */}
            <div className="flex-1 max-w-2xl mx-10">
                <GlobalSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationBell />

                <div className="h-6 w-px bg-gray-200 mx-2" />

                {/* User Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex items-center gap-3 p-1.5 pr-3 rounded-full transition-all hover:bg-gray-100 ${isMenuOpen ? 'bg-gray-100' : ''}`}
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white ring-2 ring-white shadow-sm shrink-0">
                            <span className="text-sm font-bold">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-medium text-gray-500">Xin chào,</span>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-gray-900 leading-none">{user.name}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {/* User Info Section */}
                            <div className="px-4 py-3 border-b border-gray-50 mb-1.5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shrink-0">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{user.name}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Mail className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                {user.isAdministrator && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-medium border border-blue-100">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Quản trị viên
                                    </div>
                                )}
                            </div>

                            {/* Menu Actions */}
                            <div className="px-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                        <LogOut className="w-4 h-4" />
                                    </div>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}


