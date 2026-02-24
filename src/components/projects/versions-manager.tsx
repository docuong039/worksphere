'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Pencil,
    Trash2,
    Calendar,
    CheckCircle,
    Lock,
    Unlock,
    ChevronDown,
    ChevronUp,
    List,
    X,
} from 'lucide-react';
import { projectService } from '@/services/project.service';
import { useConfirm } from '@/providers/confirm-provider';
import { VersionWithStats as Version } from '@/types';



interface VersionsManagerProps {
    projectId: string;
    versions: Version[];
    canManage: boolean;
}

const STATUS_CONFIG = {
    open: { label: 'Đang mở', icon: Unlock, color: 'text-green-600 bg-green-50' },
    locked: { label: 'Đã khóa', icon: Lock, color: 'text-orange-600 bg-orange-50' },
    closed: { label: 'Đã đóng', icon: CheckCircle, color: 'text-gray-500 bg-gray-100' },
};

export function VersionsManager({ projectId, versions: initialVersions, canManage }: VersionsManagerProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [versionsList, setVersionsList] = useState<Version[]>(initialVersions);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVersion, setEditingVersion] = useState<Version | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'open',
        dueDate: '',
    });
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setFormData({ name: '', description: '', status: 'open', dueDate: '' });
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);

        // Optimistic: thêm placeholder version ngay
        const tempId = `temp-${Date.now()}`;
        const optimisticVersion: Version = {
            id: tempId,
            name: formData.name,
            description: formData.description || null,
            status: formData.status as 'open' | 'locked' | 'closed',
            dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
            totalTasks: 0,
            closedTasks: 0,
            progress: 0,
        };
        setVersionsList((prev) => [...prev, optimisticVersion]);
        setShowAddModal(false);
        resetForm();

        try {
            const result = await projectService.createVersion(projectId, {
                ...formData,
                projectId,
                status: formData.status as 'open' | 'locked' | 'closed'
            });
            // Thay thế temp bằng real version từ server
            if (result?.data) {
                setVersionsList((prev) => prev.map((v) => (v.id === tempId ? result.data! : v)));
            }
            router.refresh(); // Background sync
        } catch (error) {
            // Rollback
            setVersionsList((prev) => prev.filter((v) => v.id !== tempId));
            setShowAddModal(true);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingVersion || !formData.name.trim()) return;
        setLoading(true);

        // Optimistic: cập nhật version ngay
        const previousVersions = versionsList;
        setVersionsList((prev) =>
            prev.map((v) =>
                v.id === editingVersion.id
                    ? {
                        ...v,
                        name: formData.name,
                        description: formData.description || null,
                        status: formData.status as 'open' | 'locked' | 'closed',
                        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
                    }
                    : v
            )
        );
        const editId = editingVersion.id;
        setEditingVersion(null);
        resetForm();

        try {
            await projectService.updateVersion(editId, {
                ...formData,
                status: formData.status as 'open' | 'locked' | 'closed'
            });
            router.refresh(); // Background sync
        } catch (error) {
            // Rollback
            setVersionsList(previousVersions);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (version: Version) => {
        confirm({
            title: 'Xóa phiên bản',
            description: version.totalTasks > 0
                ? `Phiên bản "${version.name}" có ${version.totalTasks} công việc. Các công việc này sẽ không còn thuộc phiên bản nào. Bạn có chắc chắn muốn tiếp tục?`
                : `Bạn có chắc muốn xóa phiên bản "${version.name}"?`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay
                const previousVersions = versionsList;
                setVersionsList((prev) => prev.filter((v) => v.id !== version.id));

                try {
                    await projectService.deleteVersion(version.id);
                    router.refresh(); // Background sync
                } catch (error) {
                    // Rollback
                    setVersionsList(previousVersions);
                    console.error('Delete failed', error);
                }
            }
        });
    };


    const openEditModal = (version: Version) => {
        setEditingVersion(version);
        setFormData({
            name: version.name,
            description: version.description || '',
            status: version.status,
            dueDate: version.dueDate
                ? new Date(version.dueDate).toISOString().split('T')[0]
                : '',
        });
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const groupedVersions = {
        open: versionsList.filter((v) => v.status === 'open'),
        locked: versionsList.filter((v) => v.status === 'locked'),
        closed: versionsList.filter((v) => v.status === 'closed'),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {canManage && (
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm phiên bản
                    </button>
                </div>
            )}

            {/* Version Groups */}
            {(['open', 'locked', 'closed'] as const).map((status) => {
                const statusVersions = groupedVersions[status];
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;

                if (statusVersions.length === 0) return null;

                return (
                    <div key={status} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className={`px-4 py-3 flex items-center gap-2 ${config.color}`}>
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{config.label}</span>
                            <span className="text-sm">({statusVersions.length})</span>
                        </div>

                        <div className="divide-y">
                            {statusVersions.map((version) => (
                                <div key={version.id}>
                                    <div
                                        className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                                        onClick={() =>
                                            setExpandedId(expandedId === version.id ? null : version.id)
                                        }
                                    >
                                        <button className="text-gray-400">
                                            {expandedId === version.id ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {version.name}
                                            </h3>
                                            {version.dueDate && (
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(version.dueDate)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress */}
                                        <div className="w-32">
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                                <span>{version.closedTasks}/{version.totalTasks}</span>
                                                <span>{version.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 transition-all"
                                                    style={{ width: `${version.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Link
                                                href={`/projects/${projectId}/tasks?versionId=${version.id}`}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                                                title="Xem công việc"
                                            >
                                                <List className="w-4 h-4" />
                                            </Link>

                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(version)}
                                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(version)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === version.id && version.description && (
                                        <div className="px-14 pb-4">
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                {version.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {versionsList.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    Dự án chưa có phiên bản nào.
                    {canManage && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="block mx-auto mt-4 text-blue-600 hover:underline"
                        >
                            Tạo phiên bản đầu tiên
                        </button>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showAddModal || editingVersion) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-bold text-gray-900">
                                {editingVersion ? 'Chỉnh sửa phiên bản' : 'Tạo phiên bản mới'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingVersion(null);
                                    resetForm();
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Tên phiên bản <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="VD: v1.0, Sprint 1, Release Alpha..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Mô tả chi tiết
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Ghi chú về phiên bản này..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="open">Đang mở (Open)</option>
                                        <option value="locked">Đã khóa (Locked)</option>
                                        <option value="closed">Đã đóng (Closed)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Ngày đến hạn
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingVersion(null);
                                    resetForm();
                                }}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={editingVersion ? handleUpdate : handleCreate}
                                disabled={!formData.name.trim() || loading}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                {loading ? 'Đang lưu...' : editingVersion ? 'Lưu thay đổi' : 'Tạo phiên bản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
