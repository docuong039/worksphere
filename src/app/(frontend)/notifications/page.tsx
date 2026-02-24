'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, AlertCircle, MessageSquare, User, Calendar, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-fetch';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

interface NotificationResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        unreadCount: number;
    };
}

export default function NotificationsPage() {
    const router = useRouter();
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const notifications = filter === 'unread'
        ? allNotifications.filter(n => !n.isRead)
        : allNotifications;

    // Fetch all notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const data = await apiFetch<NotificationResponse>('/api/notifications', {
                params: { limit: 100 },
            });
            if (data.success) {
                setAllNotifications(data.data.notifications);
            }
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải thông báo');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Mark as read
    const markAsRead = async (notificationIds: string[]) => {
        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ notificationIds }),
            });
            await fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ markAll: true }),
            });
            toast.success('Đã đánh dấu tất cả là đã đọc');
            await fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    // Get icon for notification type
    const getIcon = (type: string) => {
        const t = type.toLowerCase();
        switch (t) {
            case 'task_assigned':
                return <User className="w-5 h-5 text-blue-500" />;
            case 'task_status_changed':
            case 'task_updated':
                return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'task_comment_added':
                return <MessageSquare className="w-5 h-5 text-purple-500" />;
            case 'task_due_soon':
                return <Calendar className="w-5 h-5 text-red-500" />;
            case 'project_member_added':
                return <User className="w-5 h-5 text-green-500" />;
            case 'project_member_removed':
                return <User className="w-5 h-5 text-gray-400" />;
            case 'project_created':
                return <AlertCircle className="w-5 h-5 text-green-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    // Build link from metadata (DB stores metadata as JSON string, parse before use)
    const getNotificationLink = (notification: Notification) => {
        let metadata: { taskId?: string; commentId?: string; projectId?: string } | null = null;
        if (notification.metadata) {
            try {
                metadata = typeof notification.metadata === 'string'
                    ? JSON.parse(notification.metadata)
                    : notification.metadata;
            } catch {
                // invalid JSON, skip
            }
        }
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
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Quay lại Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-sm">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                            <p className="text-sm text-gray-500">
                                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo chưa đọc'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${filter === 'all'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Tất cả ({allNotifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${filter === 'unread'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Chưa đọc ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => {
                            const link = getNotificationLink(notification);
                            return (
                                <div
                                    key={notification.id}
                                    className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className={`p-2 rounded-lg ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${!notification.isRead ? 'text-blue-700' : 'text-gray-500'}`}>
                                            {notification.title}
                                        </p>
                                        {link ? (
                                            <Link
                                                href={link}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!notification.isRead) {
                                                        markAsRead([notification.id]);
                                                    }
                                                    router.push(link);
                                                    router.refresh();
                                                }}
                                                className="text-sm text-gray-900 hover:text-blue-600 font-medium block"
                                            >

                                                {notification.message}
                                            </Link>
                                        ) : (
                                            <p className="text-sm text-gray-900 font-medium">{notification.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>

                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead([notification.id])}
                                            className="flex-shrink-0 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Đánh dấu đã đọc"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-4 py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-semibold mb-1">
                            {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {filter === 'unread'
                                ? 'Tất cả thông báo đã được đánh dấu là đã đọc'
                                : 'Bạn sẽ nhận được thông báo khi có hoạt động liên quan đến bạn'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
