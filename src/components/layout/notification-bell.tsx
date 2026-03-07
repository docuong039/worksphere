'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, AlertCircle, MessageSquare, User, Calendar, MailOpen, Mail, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Fetch toàn bộ từ API (dùng lần đầu + fallback) ─────────
    const fetchNotifications = useCallback(async () => {
        try {
            const data = await apiFetch<NotificationResponse>('/api/notifications', {
                params: { limit: 10 },
            });
            if (data.success) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error('[NotificationBell] fetch error:', error);
        }
    }, []);

    // ── SSE: kết nối realtime ───────────────────────────────────
    useEffect(() => {
        // Load dữ liệu ban đầu
        fetchNotifications();

        let eventSource: EventSource | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let reconnectDelay = 2000; // bắt đầu 2s, tăng dần (exponential backoff)
        let isUnmounted = false;

        const connect = () => {
            if (isUnmounted) return;

            eventSource = new EventSource('/api/sse');

            // Kết nối thành công
            eventSource.addEventListener('connected', () => {
                reconnectDelay = 2000; // reset backoff
            });

            // Nhận notification mới từ server
            eventSource.addEventListener('notification', (e: MessageEvent) => {
                try {
                    const incoming: Notification = JSON.parse(e.data);

                    // Thêm vào đầu danh sách, giữ tối đa 10 item trong dropdown
                    setNotifications((prev) => {
                        // Tránh duplicate nếu poll chạy trùng
                        const exists = prev.some((n) => n.id === incoming.id);
                        if (exists) return prev;
                        return [incoming, ...prev].slice(0, 10);
                    });

                    // Tăng badge ngay lập tức
                    if (!incoming.isRead) {
                        setUnreadCount((c) => c + 1);
                    }
                } catch (err) {
                    console.error('[SSE] Failed to parse notification:', err);
                }
            });

            // Lỗi kết nối → reconnect với exponential backoff
            eventSource.onerror = () => {
                eventSource?.close();
                eventSource = null;

                if (!isUnmounted) {
                    reconnectTimeout = setTimeout(() => {
                        // Tăng delay tối đa 30s
                        reconnectDelay = Math.min(reconnectDelay * 1.5, 30_000);
                        connect();
                    }, reconnectDelay);
                }
            };
        };

        connect();

        // Fallback poll mỗi 5 phút — để sync lại nếu SSE bị miss
        // (ví dụ: máy tính ngủ rồi wake, SSE reconnect xong thì poll 1 lần)
        const fallbackInterval = setInterval(fetchNotifications, 5 * 60 * 1000);

        return () => {
            isUnmounted = true;
            eventSource?.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            clearInterval(fallbackInterval);
        };
    }, [fetchNotifications]);

    // ── Close dropdown khi click ngoài ─────────────────────────
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Mark as read ────────────────────────────────────────────
    const markAsRead = async (notificationIds: string[]) => {
        // Optimistic update: cập nhật UI ngay không chờ API
        setNotifications((prev) =>
            prev.map((n) =>
                notificationIds.includes(n.id) ? { ...n, isRead: true } : n
            )
        );
        setUnreadCount((c) => Math.max(0, c - notificationIds.length));

        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ notificationIds }),
            });
        } catch (error) {
            console.error('[NotificationBell] mark as read error:', error);
            // Rollback nếu lỗi
            await fetchNotifications();
        }
    };

    // ── Toggle read/unread ───────────────────────────────────────
    const toggleRead = async (notificationId: string, currentIsRead: boolean) => {
        const newIsRead = !currentIsRead;

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, isRead: newIsRead } : n
            )
        );
        setUnreadCount((c) => newIsRead ? Math.max(0, c - 1) : c + 1);

        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ notificationIds: [notificationId], isRead: newIsRead }),
            });
        } catch (error) {
            console.error('[NotificationBell] toggle read error:', error);
            await fetchNotifications();
        }
    };

    // ── Mark all as read ────────────────────────────────────────
    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ markAll: true }),
            });
        } catch (error) {
            console.error('[NotificationBell] mark all as read error:', error);
            await fetchNotifications();
        }
    };

    // ── Icon theo loại thông báo ────────────────────────────────
    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'task_watcher_added':
                return <Eye className="w-4 h-4 text-blue-500" />;
            case 'task_assigned':
                return <User className="w-4 h-4 text-blue-500" />;
            case 'task_status_changed':
            case 'task_updated':
                return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case 'task_comment_added':
                return <MessageSquare className="w-4 h-4 text-purple-500" />;
            case 'task_due_soon':
                return <Calendar className="w-4 h-4 text-red-500" />;
            case 'project_member_added':
                return <User className="w-4 h-4 text-green-500" />;
            case 'project_member_removed':
                return <User className="w-4 h-4 text-gray-400" />;
            case 'project_created':
                return <AlertCircle className="w-4 h-4 text-green-600" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    // ── Build link từ metadata ──────────────────────────────────
    const getNotificationLink = (notification: Notification): string | null => {
        let metadata: { taskId?: string; commentId?: string; projectId?: string } | null = null;
        if (notification.metadata) {
            try {
                metadata = typeof notification.metadata === 'string'
                    ? JSON.parse(notification.metadata)
                    : notification.metadata;
            } catch {
                // invalid JSON, bỏ qua
            }
        }
        if (!metadata) return null;

        if (metadata.taskId) {
            const base = `/tasks/${metadata.taskId}`;
            return metadata.commentId ? `${base}#comment-${metadata.commentId}` : base;
        }
        if (metadata.projectId) return `/projects/${metadata.projectId}`;
        return null;
    };

    // ── Format thời gian ────────────────────────────────────────
    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60_000);
        const hours = Math.floor(diff / 3_600_000);
        const days = Math.floor(diff / 86_400_000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    // ─────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Thông báo"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Thông báo</h3>
                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className={`text-sm flex items-center gap-1 transition-colors ${unreadCount > 0
                                ? 'text-blue-600 hover:text-blue-700 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <CheckCheck className="w-4 h-4" />
                            Đánh dấu tất cả đã đọc
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const link = getNotificationLink(notification);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${!notification.isRead ? 'text-blue-700' : 'text-gray-500'
                                                }`}>
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
                                                        setIsOpen(false);
                                                        router.push(link);
                                                        router.refresh();
                                                    }}
                                                    className="text-sm text-gray-800 hover:text-blue-600 block"
                                                >
                                                    {notification.message}
                                                </Link>
                                            ) : (
                                                <p className="text-sm text-gray-800">{notification.message}</p>
                                            )}

                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => toggleRead(notification.id, notification.isRead)}
                                            className={`flex-shrink-0 p-1 rounded transition-colors ${notification.isRead
                                                ? 'text-gray-400 hover:text-blue-600'
                                                : 'text-gray-400 hover:text-green-600'
                                                }`}
                                            title={notification.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                                        >
                                            {notification.isRead ? (
                                                <Mail className="w-4 h-4" />
                                            ) : (
                                                <MailOpen className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>Không có thông báo</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-gray-200 text-center">
                        <Link
                            href="/notifications"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => setIsOpen(false)}
                        >
                            Xem tất cả thông báo
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
