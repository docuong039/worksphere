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
    ArrowRight,
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
                window.location.reload();
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
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm dự án..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
                        {(['active', 'archived', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg ${filter === f
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
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
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Tạo dự án mới
                </button>
            </div>

            {/* Project Grid - STATIC STYLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <div
                        key={project.id}
                        className={`bg-white rounded-2xl border border-gray-200 p-6 ${project.isArchived ? 'opacity-70' : ''
                            }`}
                    >
                        <div>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                                        <FolderKanban className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="text-xl font-bold text-gray-900 hover:text-blue-600 truncate block leading-tight"
                                        >
                                            {project.name}
                                        </Link>
                                        <p className="text-sm text-gray-400 font-mono mt-0.5">#{project.identifier}</p>
                                    </div>
                                </div>

                                {/* Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {menuOpenId === project.id && (
                                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2">
                                            <Link
                                                href={`/projects/${project.id}/settings`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Settings className="w-4 h-4 text-gray-400" />
                                                Cài đặt
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    handleArchive(project.id);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Archive className="w-4 h-4 text-gray-400" />
                                                {project.isArchived ? 'Khôi phục' : 'Lưu trữ'}
                                            </button>
                                            <div className="h-px bg-gray-100 my-1 mx-2" />
                                            <button
                                                onClick={() => {
                                                    handleDelete(project);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Xóa dự án
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {project.description && (
                                <p className="text-gray-600 mb-6 line-clamp-2 min-h-[2.5rem] text-[15px] leading-relaxed">
                                    {project.description}
                                </p>
                            )}
                        </div>

                        <div>
                            {/* Stats & Team */}
                            <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tasks</span>
                                        <span className="flex items-center gap-1.5 text-base font-bold text-gray-900">
                                            <ListTodo className="w-4 h-4 text-blue-500 opacity-70" />
                                            {project._count.tasks}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-gray-100" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Team</span>
                                        <div className="flex items-center -space-x-2 mt-0.5">
                                            {project.members.slice(0, 3).map((member) => (
                                                <div
                                                    key={member.user.id}
                                                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm overflow-hidden bg-gray-100"
                                                    title={member.user.name}
                                                >
                                                    {member.user.avatar ? (
                                                        <img
                                                            src={member.user.avatar}
                                                            alt={member.user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-500">
                                                            {member.user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {project._count.members > 3 && (
                                                <div className="w-7 h-7 bg-gray-50 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                    <span className="text-[9px] font-bold text-gray-500">+{project._count.members - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/projects/${project.id}`}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white"
                                >
                                    Chi tiết
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Archived Badge */}
                            {project.isArchived && (
                                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 py-1.5 rounded-lg w-full uppercase tracking-wider">
                                    <Archive className="w-3 h-3" />
                                    Dự án đã lưu trữ
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <FolderKanban className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có dự án nào</h3>
                    <p className="text-gray-500 mb-6">Tạo dự án đầu tiên để bắt đầu làm việc</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Tạo dự án mới
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo dự án mới</h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
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
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none"
                                    placeholder="VD: Website Redesign"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                    Định danh (identifier) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.identifier}
                                    onChange={(e) =>
                                        setFormData({ ...formData, identifier: e.target.value.toLowerCase() })
                                    }
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none"
                                    placeholder="website-redesign"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none resize-none"
                                    placeholder="Mô tả ngắn về dự án..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ name: '', identifier: '', description: '' });
                                    setError('');
                                }}
                                className="flex-1 py-2.5 text-gray-500 font-bold rounded-xl hover:bg-gray-100"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !formData.name.trim() || !formData.identifier.trim()}
                                className="flex-[2] py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {loading ? 'Đang tạo...' : 'Tạo dự án'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
