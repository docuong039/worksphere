'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    FolderKanban,
    Users,
    ListTodo,
    MoreVertical,
    Archive,
    Trash2,
    Settings,
    Search,
} from 'lucide-react';
import type { DateLike } from '@/lib/types';

interface Project {
    id: string;
    name: string;
    identifier: string;
    description: string | null;
    isArchived: boolean;
    createdAt: DateLike;
    updatedAt: DateLike;
    creator: {
        id: string;
        name: string;
        avatar: string | null;
    };
    members: Array<{
        user: {
            id: string;
            name: string;
            avatar: string | null;
        };
    }>;
    _count: {
        tasks: number;
        members: number;
    };
}

interface ProjectListProps {
    projects: Project[];
}

export function ProjectList({ projects: initialProjects }: ProjectListProps) {
    const router = useRouter();
    const [projects] = useState(initialProjects);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
    const [search, setSearch] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        identifier: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter projects
    const filteredProjects = projects.filter((project) => {
        // Filter by status
        if (filter === 'active' && project.isArchived) return false;
        if (filter === 'archived' && !project.isArchived) return false;

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                project.name.toLowerCase().includes(searchLower) ||
                project.identifier.toLowerCase().includes(searchLower)
            );
        }

        return true;
    });

    // Create project
    const handleCreate = async () => {
        if (!formData.name.trim() || !formData.identifier.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ name: '', identifier: '', description: '' });
                router.refresh();
                window.location.reload(); // Force reload to show the new project
            } else {
                const data = await res.json();
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMsgs = data.errors.map((e: any) => e.message).join(', ');
                    setError(`${data.error}: ${errorMsgs}`);
                } else {
                    setError(data.error || 'Có lỗi xảy ra');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Archive project
    const handleArchive = async (id: string) => {
        try {
            await fetch(`/api/projects/${id}/archive`, { method: 'POST' });
            router.refresh();
        } catch (err) {
            console.error(err);
        }
    };

    // Delete project
    const handleDelete = async (project: Project) => {
        if (!confirm(`Bạn có chắc muốn xóa dự án "${project.name}"?\n\nTất cả tasks, comments và dữ liệu liên quan sẽ bị xóa vĩnh viễn!`)) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Auto generate identifier from name
    const generateIdentifier = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 30);
    };

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm dự án..."
                            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                        {(['active', 'archived', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 text-sm rounded ${filter === f
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {f === 'active' ? 'Đang hoạt động' : f === 'archived' ? 'Đã lưu trữ' : 'Tất cả'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Create Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Tạo dự án
                </button>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                    <div
                        key={project.id}
                        className={`bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 transition-colors ${project.isArchived ? 'opacity-60' : ''
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FolderKanban className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block"
                                    >
                                        {project.name}
                                    </Link>
                                    <p className="text-xs text-gray-500 truncate">{project.identifier}</p>
                                </div>
                            </div>

                            {/* Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {menuOpenId === project.id && (
                                    <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                        <Link
                                            href={`/projects/${project.id}/settings`}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Cài đặt
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleArchive(project.id);
                                                setMenuOpenId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Archive className="w-4 h-4" />
                                            {project.isArchived ? 'Khôi phục' : 'Lưu trữ'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDelete(project);
                                                setMenuOpenId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Xóa
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {project.description && (
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                                <ListTodo className="w-3 h-3" />
                                {project._count.tasks}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {project._count.members}
                            </span>
                        </div>

                        {/* Members Avatars */}
                        <div className="flex items-center -space-x-1.5">
                            {project.members.slice(0, 5).map((member) => (
                                <div
                                    key={member.user.id}
                                    className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-[10px]"
                                    title={member.user.name}
                                >
                                    {member.user.avatar ? (
                                        <img
                                            src={member.user.avatar}
                                            alt={member.user.name}
                                            className="w-full h-full rounded-full"
                                        />
                                    ) : (
                                        <span className="text-xs text-gray-600">
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {project._count.members > 5 && (
                                <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                                    <span className="text-gray-600">+{project._count.members - 5}</span>
                                </div>
                            )}
                        </div>

                        {/* Archived Badge */}
                        {project.isArchived && (
                            <div className="mt-3 inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                <Archive className="w-3 h-3" />
                                Đã lưu trữ
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dự án nào</h3>
                    <p className="text-gray-500 mb-4">Tạo dự án đầu tiên để bắt đầu quản lý công việc</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo dự án
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tạo dự án mới</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên dự án <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setFormData({
                                            ...formData,
                                            name,
                                            identifier: formData.identifier || generateIdentifier(name),
                                        });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: Website Redesign"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Định danh (identifier) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.identifier}
                                    onChange={(e) =>
                                        setFormData({ ...formData, identifier: e.target.value.toLowerCase() })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="website-redesign"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Dùng cho URL và API. Chỉ chứa chữ thường, số và dấu gạch ngang.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mô tả ngắn về dự án..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ name: '', identifier: '', description: '' });
                                    setError('');
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !formData.name.trim() || !formData.identifier.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang tạo...' : 'Tạo dự án'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
