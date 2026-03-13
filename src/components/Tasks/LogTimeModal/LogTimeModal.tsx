// global - used in: projects, tasks, time-logs
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, Loader2, X, Calendar, Activity, MessageSquare, Briefcase, FileText } from 'lucide-react';

interface ActivityType {
    id: string;
    name: string;
    isDefault?: boolean;
}

interface ProjectOption {
    id: string;
    name: string;
    identifier: string;
}

interface TaskOption {
    id: string;
    number: number;
    title: string;
    tracker: { name: string };
}

interface LogTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId?: string;
    projectId?: string;
    onSuccess?: () => void;
}

export function LogTimeModal({
    isOpen,
    onClose,
    taskId: initialTaskId,
    projectId: initialProjectId,
    onSuccess,
}: LogTimeModalProps) {
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [fetchingActivities, setFetchingActivities] = useState(false);

    // Projects & Tasks for selection
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [tasks, setTasks] = useState<TaskOption[]>([]);
    const [fetchingTasks, setFetchingTasks] = useState(false);

    const [formData, setFormData] = useState({
        spentOn: new Date().toISOString().split('T')[0],
        hours: '',
        activityId: '',
        comments: '',
        projectId: initialProjectId || '',
        taskId: initialTaskId || '',
    });

    // Xác định xem có cần hiển thị trường chọn project/task hay không
    const showProjectSelector = !initialProjectId;
    const showTaskSelector = !initialTaskId;

    useEffect(() => {
        if (isOpen) {
            fetchActivities();
            if (showProjectSelector) {
                fetchProjects();
            }
            if (showTaskSelector && formData.projectId) {
                fetchTasks(formData.projectId);
            }
        }
    }, [isOpen]);

    // Khi project thay đổi → fetch lại tasks
    useEffect(() => {
        if (isOpen && showTaskSelector && formData.projectId) {
            fetchTasks(formData.projectId);
        } else {
            setTasks([]);
        }
    }, [formData.projectId]);

    const fetchActivities = async () => {
        setFetchingActivities(true);
        try {
            const res = await fetch('/api/time-entry-activities');
            if (res.ok) {
                const data = await res.json();
                setActivities(data.data || []);
                const defaultActivity = data.data?.find((a: any) => a.isDefault);
                if (defaultActivity) {
                    setFormData(prev => ({ ...prev, activityId: defaultActivity.id }));
                }
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setFetchingActivities(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects?limit=100');
            if (res.ok) {
                const data = await res.json();
                const projectList = data.data?.projects || data.data || [];
                setProjects(projectList);
                // Nếu chưa chọn project → chọn cái đầu tiên
                if (!formData.projectId && projectList.length > 0) {
                    setFormData(prev => ({ ...prev, projectId: projectList[0].id }));
                }
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchTasks = async (projectId: string) => {
        setFetchingTasks(true);
        try {
            const res = await fetch(`/api/tasks?projectId=${projectId}&limit=100&isClosed=false`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.data?.tasks || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setFetchingTasks(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.hours || !formData.activityId || !formData.projectId) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/time-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hours: parseFloat(formData.hours),
                    spentOn: formData.spentOn,
                    activityId: formData.activityId,
                    comments: formData.comments || null,
                    taskId: formData.taskId || null,
                    projectId: formData.projectId,
                }),
            });

            if (res.ok) {
                toast.success('Đã ghi nhận thời gian');
                onSuccess?.();
                onClose();
                // Reset form
                setFormData({
                    spentOn: new Date().toISOString().split('T')[0],
                    hours: '',
                    activityId: '',
                    comments: '',
                    projectId: initialProjectId || '',
                    taskId: initialTaskId || '',
                });
            } else {
                const error = await res.json();
                toast.error(error.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900">
                            Ghi nhận thời gian
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-6 space-y-5">
                        {/* Project Selector */}
                        {showProjectSelector && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-0.5">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Dự án <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value, taskId: '' })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Chọn dự án</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {showTaskSelector && formData.projectId && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-0.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    Công việc <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.taskId}
                                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>
                                        {fetchingTasks ? "Đang tải..." : "Chọn công việc"}
                                    </option>
                                    {tasks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            #{t.number} - [{t.tracker.name}] {t.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-0.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Ngày thực hiện
                                </label>
                                <input
                                    type="date"
                                    value={formData.spentOn}
                                    onChange={(e) => setFormData({ ...formData, spentOn: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-0.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Số giờ (h)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    placeholder="0.0"
                                    value={formData.hours}
                                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-0.5">
                                <Activity className="w-3.5 h-3.5" />
                                Hoạt động
                            </label>
                            <select
                                value={formData.activityId}
                                onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>
                                    {fetchingActivities ? "Đang tải dữ liệu..." : "Chọn loại hoạt động"}
                                </option>
                                {activities.map((activity) => (
                                    <option key={activity.id} value={activity.id}>
                                        {activity.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-0.5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Bình luận
                            </label>
                            <textarea
                                placeholder="Bạn đã thực hiện công việc gì?"
                                value={formData.comments}
                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                rows={3}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || fetchingActivities || !formData.hours || !formData.activityId || !formData.projectId || (showTaskSelector && !formData.taskId)}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Ghi nhận'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
