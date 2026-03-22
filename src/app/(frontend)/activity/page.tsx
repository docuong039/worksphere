'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, CheckSquare, Folder, User, Filter, Calendar, Clock } from 'lucide-react';
import { activityService } from '@/api-client/activity.service';
import { ActivityItem } from '@/types';
import { toast } from 'sonner';

// =============================================================================
// Phần 1: State & Data Fetching
// Quản lý trạng thái trang, bộ lọc và gọi API tải danh sách hoạt động
// =============================================================================
export default function ActivityPage() {
    const searchParams = useSearchParams();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState({
        task: true,
        project: true,
        user: true,
    });

    const userId = searchParams.get('userId');

    // Reset về trang 1 và xoá danh sách cũ mỗi khi bộ lọc hoặc userId thay đổi,
    // tránh hiển thị dữ liệu lẫn lộn giữa các lần lọc khác nhau.
    useEffect(() => {
        setPage(1);
        setActivities([]);
        setHasMore(true);
    }, [selectedTypes, userId]);

    // Tải danh sách hoạt động mỗi khi page, userId hoặc selectedTypes thay đổi.
    // Nếu page > 1 thì append vào danh sách hiện có (infinite scroll),
    // nếu page = 1 thì ghi đè (reset sau khi đổi bộ lọc).
    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const activeTypes = Object.entries(selectedTypes)
                    .filter(([, active]) => active)
                    .map(([type]) => type);

                // Không gọi API nếu người dùng bỏ chọn tất cả bộ lọc
                if (activeTypes.length === 0) {
                    setActivities([]);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }

                const response = await activityService.getAll({
                    page,
                    limit: 50,
                    userId: userId || undefined
                });

                if (response.success) {
                    // Lọc theo loại entity ở phía client vì backend hiện chưa hỗ trợ
                    // tham số `types` trong query. Cần refactor lại khi backend cập nhật.
                    const filtered = response.data.activities.filter((a) =>
                        activeTypes.includes(a.entityType)
                    );

                    if (page === 1) {
                        setActivities(filtered);
                    } else {
                        setActivities(prev => [...prev, ...filtered]);
                    }

                    // Nếu API trả về đủ 50 bản ghi thì giả định còn trang tiếp theo
                    setHasMore(response.data.activities.length >= 50);
                }
            } catch (error) {
                toast.error('Không thể tải lịch sử hoạt động. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
                console.error('Failed to fetch activity:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [page, userId, selectedTypes]);

    // =============================================================================
    // Phần 2: Các hàm xử lý / format dữ liệu
    // Chuyển đổi dữ liệu thô từ API thành chuỗi/JSX hiển thị cho người dùng
    // =============================================================================

    // Chuyển timestamp thành nhãn ngày thân thiện: "Hôm nay", "Hôm qua", hoặc tên thứ.
    // Trả về object gồm label (Hôm nay / Thứ Hai...) và subLabel (dd/mm/yyyy).
    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const weekday = date.toLocaleDateString('vi-VN', { weekday: 'long' });
        const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (isToday) {
            return { label: 'Hôm nay', subLabel: `${weekday}, ${dayMonth}` };
        } else if (isYesterday) {
            return { label: 'Hôm qua', subLabel: `${weekday}, ${dayMonth}` };
        } else {
            return { label: weekday.charAt(0).toUpperCase() + weekday.slice(1), subLabel: dayMonth };
        }
    };

    // Gom các activity có cùng ngày vào một nhóm để render theo từng ngày.
    // Key là chuỗi ngày dạng "Mon Mar 22 2025", value là mảng các activity trong ngày đó.
    const grouped = activities.reduce((acc, act) => {
        const dateKey = new Date(act.createdAt).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(act);
        return acc;
    }, {} as Record<string, ActivityItem[]>);

    // Trả về icon tương ứng với loại entity (task / project / user)
    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <CheckSquare className="w-4 h-4 text-blue-600" />;
            case 'project': return <Folder className="w-4 h-4 text-purple-600" />;
            case 'user': return <User className="w-4 h-4 text-green-600" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    // Trả về badge phân loại có màu tương ứng (xanh dương / tím / xanh lá)
    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'task': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Công việc</span>;
            case 'project': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Dự án</span>;
            case 'user': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Thành viên</span>;
            default: return null;
        }
    };

    // Ánh xạ tên field kỹ thuật trong DB sang tên tiếng Việt để hiển thị trong phần "chi tiết thay đổi".
    // Trả về null cho các field dạng ID (statusId, assigneeId...) vì giá trị UUID không có ý nghĩa với người dùng —
    // thông tin đã được phản ánh qua các field tên tương ứng (status, assignee...).
    const getFieldLabel = (fieldName: string): string | null => {
        const hiddenFields = ['statusId', 'priorityId', 'assigneeId', 'trackerId', 'parentId', 'projectId'];
        if (hiddenFields.includes(fieldName)) return null;

        const fieldMap: Record<string, string> = {
            'title': 'Tiêu đề',
            'description': 'Mô tả',
            'status': 'Trạng thái',
            'priority': 'Độ ưu tiên',
            'assignee': 'Người thực hiện',
            'dueDate': 'Ngày kết thúc',
            'startDate': 'Ngày bắt đầu',
            'estimatedHours': 'Giờ ước tính',
            'progress': 'Tiến độ',
            'tracker': 'Loại công việc',
            'name': 'Tên',
            'identifier': 'Mã định danh',
            'isPublic': 'Công khai',
            'archived': 'Lưu trữ',
            'parent': 'Công việc cha',
            'doneRatio': 'Hoàn thành',
        };
        return fieldMap[fieldName] || fieldName;
    };

    // Dịch action string từ API (created, updated...) sang câu tiếng Việt phù hợp với từng loại entity.
    // Ví dụ: action="created" + entityType="task" → "đã tạo công việc"
    const getActionText = (action: string, entityType: string) => {
        const actionLower = action.toLowerCase();
        switch (actionLower) {
            case 'created': return entityType === 'task' ? 'đã tạo công việc' : 'đã tạo';
            case 'updated': return 'đã cập nhật';
            case 'deleted': return 'đã xóa';
            case 'archived': return 'đã lưu trữ';
            case 'unarchived': return 'đã hủy lưu trữ';
            case 'commented': return 'đã bình luận vào';
            default: return `đã ${actionLower}`;
        }
    };

    // Tổng hợp câu mô tả hành động và link dẫn đến đối tượng bị tác động.
    // Có 4 trường hợp xử lý:
    //   1. Task còn tồn tại → link đến trang task kèm tên project
    //   2. Project còn tồn tại → link đến trang project
    //   3. Project đã bị xoá (entityDetails = null) → lấy tên từ changes.old/new, hiển thị dạng text thường
    //   4. Fallback các entityType khác → hiển thị tên loại entity
    const formatAction = (act: ActivityItem) => {
        let actionText = '';
        let targetLink = null;

        if (act.entityType === 'task' && act.entityDetails) {
            // Trường hợp 1: Task còn tồn tại
            const task = act.entityDetails;
            targetLink = (
                <Link href={`/tasks/${task.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    {task.project?.name && <span className="text-gray-500">{task.project.name}</span>}
                    {task.project?.name && <span className="text-gray-400 mx-1">›</span>}
                    <span>#{task.number}: {task.title}</span>
                </Link>
            );
            actionText = getActionText(act.action, 'task');
        } else if (act.entityType === 'project' && act.entityDetails) {
            // Trường hợp 2: Project còn tồn tại
            const project = act.entityDetails;
            targetLink = (
                <Link href={`/projects/${project.id}`} className="font-medium text-purple-600 hover:text-purple-800 hover:underline">
                    {project.name}
                </Link>
            );
            actionText = getActionText(act.action, 'project') + ' dự án';
        } else if (act.entityType === 'project' && !act.entityDetails) {
            // Trường hợp 3: Project đã bị xoá — lấy tên từ snapshot trong changes
            const projectName = String(act.changes?.old?.name || act.changes?.new?.name || 'Dự án');
            targetLink = <span className="font-medium text-gray-500">{projectName}</span>;
            actionText = getActionText(act.action, 'project') + ' dự án';
        } else {
            // Trường hợp 4: Các loại entity khác chưa được xử lý riêng
            actionText = getActionText(act.action, act.entityType) + ` ${act.entityType}`;
        }

        return { actionText, targetLink };
    };

    // =============================================================================
    // Phần 3: Render giao diện
    // Layout 2 cột: sidebar bộ lọc (trái) + danh sách hoạt động nhóm theo ngày (phải)
    // =============================================================================
    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hoạt động</h1>
                        <p className="text-sm text-gray-500">Theo dõi các thay đổi trong hệ thống</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar bộ lọc — sticky để luôn hiển thị khi scroll */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            Lọc theo loại
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.task}
                                    onChange={e => setSelectedTypes(prev => ({ ...prev, task: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-gray-700">Công việc</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.project}
                                    onChange={e => setSelectedTypes(prev => ({ ...prev, project: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <Folder className="w-4 h-4 text-purple-600" />
                                <span className="text-sm text-gray-700">Dự án</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.user}
                                    onChange={e => setSelectedTypes(prev => ({ ...prev, user: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <User className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-700">Thành viên</span>
                            </label>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <div className="text-xs text-gray-500">
                                Tổng: <span className="font-medium text-gray-700">{activities.length}</span> hoạt động
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách hoạt động nhóm theo ngày */}
                <div className="flex-1 min-w-0">
                    {Object.entries(grouped).map(([dateKey, items]) => {
                        const header = formatDateHeader(dateKey);
                        return (
                            <div key={dateKey} className="mb-6">
                                {/* Thanh tiêu đề ngày — sticky để hiển thị khi scroll qua danh sách dài */}
                                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-gray-50/95 backdrop-blur-sm py-3 z-10">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-gray-900">{header.label}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-sm text-gray-500">{header.subLabel}</span>
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        {items.length} hoạt động
                                    </span>
                                </div>

                                {/* Bảng danh sách hoạt động trong ngày */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <table className="w-full">
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((act) => {
                                                const { actionText, targetLink } = formatAction(act);
                                                return (
                                                    <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                                                        {/* Giờ xảy ra hoạt động */}
                                                        <td className="px-4 py-3 w-20">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Clock className="w-3 h-3" />
                                                                <span className="font-mono">
                                                                    {new Date(act.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Icon loại entity */}
                                                        <td className="px-2 py-3 w-10">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                                                                {getIcon(act.entityType)}
                                                            </div>
                                                        </td>

                                                        {/* Nội dung chính: "Người dùng + hành động + link đối tượng" */}
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm">
                                                                <span className="font-medium text-gray-900">{act.user.name}</span>
                                                                <span className="text-gray-600 mx-1">{actionText}</span>
                                                                {targetLink}
                                                            </div>

                                                            {/* Chi tiết các field bị thay đổi, chỉ hiển thị khi action là "updated".
                                                                Duyệt qua từng key trong changes.new, bỏ qua nếu:
                                                                - Field là dạng ID (ẩn theo getFieldLabel)
                                                                - Giá trị cũ và mới giống nhau */}
                                                            {act.changes && act.action.toLowerCase() === 'updated' && act.changes.old && act.changes.new && (() => {
                                                                const { old: oldChanges, new: newChanges } = act.changes;
                                                                return (
                                                                    <div className="mt-1.5 flex flex-wrap gap-2">
                                                                        {Object.keys(newChanges).map((key: string) => {
                                                                            const fieldLabel = getFieldLabel(key);
                                                                            if (!fieldLabel) return null;

                                                                            const oldValue = oldChanges?.[key];
                                                                            const newValue = newChanges?.[key];
                                                                            if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return null;
                                                                            return (
                                                                                <span key={key} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                                                    <span className="font-medium">{fieldLabel}:</span>
                                                                                    {oldValue !== undefined && (
                                                                                        <span className="line-through text-gray-400">{String(oldValue ?? '-')}</span>
                                                                                    )}
                                                                                    <span className="text-blue-600">→ {String(newValue ?? '-')}</span>
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>

                                                        {/* Badge phân loại entity */}
                                                        <td className="px-4 py-3 w-28 text-right">
                                                            {getTypeBadge(act.entityType)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3 text-gray-500">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span>Đang tải...</span>
                            </div>
                        </div>
                    )}

                    {!loading && activities.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Không tìm thấy hoạt động nào</p>
                            <p className="text-sm text-gray-400 mt-1">Thử thay đổi bộ lọc để xem thêm</p>
                        </div>
                    )}

                    {hasMore && !loading && activities.length > 0 && (
                        <div className="text-center py-4">
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                            >
                                Tải thêm hoạt động
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}