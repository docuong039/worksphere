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
} from 'lucide-react';

interface Version {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    dueDate?: Date | string | null;
    totalTasks: number;
    closedTasks: number;
    progress: number;
}

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

export function VersionsManager({ projectId, versions, canManage }: VersionsManagerProps) {
    const router = useRouter();
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

        try {
            const res = await fetch(`/api/projects/${projectId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowAddModal(false);
                resetForm();
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingVersion || !formData.name.trim()) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/versions/${editingVersion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setEditingVersion(null);
                resetForm();
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (version: Version) => {
        if (version.totalTasks > 0) {
            if (!confirm(`Version "${version.name}" có ${version.totalTasks} công việc. Các công việc này sẽ không còn thuộc version nào. Tiếp tục?`)) {
                return;
            }
        } else if (!confirm(`Xóa version "${version.name}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/versions/${version.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
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
        open: versions.filter((v) => v.status === 'open'),
        locked: versions.filter((v) => v.status === 'locked'),
        closed: versions.filter((v) => v.status === 'closed'),
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

            {versions.length === 0 && (
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">
                                {editingVersion ? 'Sửa phiên bản' : 'Thêm phiên bản mới'}
                            </h2>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: v1.0, Sprint 1..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="open">Đang mở</option>
                                        <option value="locked">Đã khóa</option>
                                        <option value="closed">Đã đóng</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày đến hạn
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingVersion(null);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={editingVersion ? handleUpdate : handleCreate}
                                disabled={!formData.name.trim() || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang lưu...' : editingVersion ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
