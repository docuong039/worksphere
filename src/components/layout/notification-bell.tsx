'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, AlertCircle, MessageSquare, User, Calendar } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    message: string;
    link: string | null;
    isRead: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications?limit=10');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        let isSubscribed = true;

        const load = async () => {
            if (isSubscribed) {
                await fetchNotifications();
            }
        };

        load();

        const interval = setInterval(() => {
            load();
        }, 60000);

        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, [fetchNotifications]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark as read
    const markAsRead = async (notificationIds: string[]) => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds }),
            });
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    // Get icon and color for notification type
    const getIcon = (type: string) => {
        const t = type.toLowerCase();
        switch (t) {
            case 'task_assigned':
                return <User className="w-4 h-4 text-blue-500" />;
            case 'task_status_changed':
            case 'task_updated':
                return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case 'task_comment_added':
                return <MessageSquare className="w-4 h-4 text-purple-500" />;
            case 'task_due_soon':
                return <Calendar className="w-4 h-4 text-red-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    // Helper: Get link from metadata if missing
    const getNotificationLink = (notification: Notification) => {
        if (notification.link) return notification.link;

        const metadata = notification.metadata as { taskId?: string; commentId?: string; projectId?: string } | null;
        if (!metadata) return null;

        if (metadata.taskId) {
            let link = `/tasks/${metadata.taskId}`;
            if (metadata.commentId) {
                link += `#comment-${metadata.commentId}`;
            }
            return link;
        }

        if (metadata.projectId) {
            return `/projects/${metadata.projectId}`;
        }

        return null;
    };


    // Format time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Đánh dấu tất cả
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${!notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {(() => {
                                            const link = getNotificationLink(notification);
                                            if (link) {
                                                return (
                                                    <Link
                                                        href={link}
                                                        onClick={() => {
                                                            if (!notification.isRead) {
                                                                markAsRead([notification.id]);
                                                            }
                                                            setIsOpen(false);
                                                        }}
                                                        className="text-sm text-gray-900 hover:text-blue-600 font-medium block"
                                                    >
                                                        {notification.message}
                                                    </Link>
                                                );
                                            }
                                            return <p className="text-sm text-gray-900">{notification.message}</p>;
                                        })()}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>

                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead([notification.id])}
                                            className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600"
                                            title="Đánh dấu đã đọc"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>Không có thông báo</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 text-center">
                            <Link
                                href="/notifications"
                                className="text-sm text-blue-600 hover:text-blue-700"
                                onClick={() => setIsOpen(false)}
                            >
                                Xem tất cả thông báo
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
