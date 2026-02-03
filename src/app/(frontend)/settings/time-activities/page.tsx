'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Activity,
    Plus,
    Pencil,
    Trash2,
    GripVertical,
    Check,
    X,
    Loader2,
} from 'lucide-react';
import { timeActivityService } from '@/services/time-activity.service';
import type { TimeEntryActivity } from '@/types';



export default function TimeEntryActivitiesPage() {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<TimeEntryActivity[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    // New activity form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState('');

    const fetchActivities = async () => {
        try {
            const res = await timeActivityService.getAll({ includeInactive: true });
            if (res.data) {
                setActivities(res.data);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await timeActivityService.create({
                name: newName.trim(),
                position: activities.length,
                isActive: true,
            });
            toast.success('Đã tạo hoạt động mới');
            setNewName('');
            setShowNewForm(false);
            fetchActivities();
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: Partial<TimeEntryActivity>) => {
        setSaving(true);
        try {
            await timeActivityService.update(id, data);
            toast.success('Đã cập nhật');
            setEditingId(null);
            fetchActivities();
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa hoạt động này?')) return;

        try {
            await timeActivityService.delete(id);
            toast.success('Đã xóa hoạt động');
            fetchActivities();
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        }
    };

    const handleSetDefault = async (id: string) => {
        // First, remove default from all others
        for (const act of activities) {
            if (act.isDefault && act.id !== id) {
                await handleUpdate(act.id, { isDefault: false });
            }
        }
        await handleUpdate(id, { isDefault: true });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hoạt động thời gian</h1>
                        <p className="text-sm text-gray-500">Quản lý các loại hoạt động cho ghi nhận thời gian</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowNewForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Thêm mới
                </button>
            </div>

            {/* Activities List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên hoạt động</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Mặc định</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Trạng thái</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* New Activity Form */}
                            {showNewForm && (
                                <tr className="bg-orange-50">
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3">
                                        <form onSubmit={handleCreate} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="Tên hoạt động mới..."
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={saving || !newName.trim()}
                                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowNewForm(false); setNewName(''); }}
                                                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            )}

                            {activities.map((activity) => (
                                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === activity.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleUpdate(activity.id, { name: editName })}
                                                    disabled={saving || !editName.trim()}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                                                >
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`font-medium ${activity.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {activity.name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleSetDefault(activity.id)}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${activity.isDefault
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'border-gray-300 hover:border-orange-400'
                                                }`}
                                        >
                                            {activity.isDefault && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleUpdate(activity.id, { isActive: !activity.isActive })}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${activity.isActive
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {activity.isActive ? 'Hoạt động' : 'Ẩn'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setEditingId(activity.id); setEditName(activity.name); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(activity.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {activities.length === 0 && !showNewForm && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        Chưa có loại hoạt động nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Hướng dẫn</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• <strong>Loại hoạt động</strong> được sử dụng khi ghi nhận thời gian làm việc (VD: Development, Testing, Meeting...)</li>
                    <li>• <strong>Mặc định</strong>: Loại hoạt động sẽ được chọn sẵn khi mở form ghi thời gian</li>
                    <li>• <strong>Ẩn</strong>: Loại hoạt động sẽ không hiển thị trong danh sách chọn</li>
                </ul>
            </div>
        </div>
    );
}
