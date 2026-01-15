'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Plus,
    FolderKanban,
    MoreVertical,
    Archive,
    Trash2,
    Settings,
    Search,

    Pencil,
} from 'lucide-react';
import Image from 'next/image';
import type { ApiFieldError } from '@/lib/api-error';
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
    tasks: { id: string }[];
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
    const [editingProject, setEditingProject] = useState<Project | null>(null);

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
            } else {
                const data = await res.json();
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMsgs = (data.errors as ApiFieldError[]).map((e) => e.message).join(', ');
                    setError(`${data.error}: ${errorMsgs}`);
                } else {
                    setError(data.error || 'Có lỗi xảy ra');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Update project
    const handleUpdate = async () => {
        if (!editingProject) return;
        if (!formData.name.trim() || !formData.identifier.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/projects/${editingProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setEditingProject(null);
                setFormData({ name: '', identifier: '', description: '' });
                router.refresh();
                toast.success('Đã cập nhật dự án thành công');
            } else {
                const data = await res.json();
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMsgs = (data.errors as ApiFieldError[]).map((e) => e.message).join(', ');
                    setError(`${data.error}: ${errorMsgs}`);
                } else {
                    setError(data.error || 'Có lỗi xảy ra');
                }
            }
        } catch {
            setError('Lỗi kết nối');
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
                toast.success('Đã xóa dự án thành công');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
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

            {/* Project Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => {
                    const completedTasks = project.tasks?.length || 0;
                    const totalTasks = project._count.tasks || 0;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;


                    return (
                        <div
                            key={project.id}
                            className={`bg-white rounded-2xl border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow relative group ${project.isArchived ? 'opacity-70' : ''}`}
                        >
                            {/* Top Row: Icon and Menu */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                    <FolderKanban className="w-6 h-6 text-white" />
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {menuOpenId === project.id && (
                                        <div className="absolute right-0 top-8 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2">
                                            <Link
                                                href={`/projects/${project.id}/settings`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Settings className="w-4 h-4 text-gray-400" />
                                                Cài đặt
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setEditingProject(project);
                                                    setFormData({
                                                        name: project.name,
                                                        identifier: project.identifier,
                                                        description: project.description || '',
                                                    });
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil className="w-4 h-4 text-gray-400" />
                                                Chỉnh sửa
                                            </button>
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

                            {/* Project Name */}
                            <h3 className="font-bold text-lg text-gray-900 mb-3 truncate" title={project.name}>
                                {project.name}
                            </h3>

                            {/* Progress */}
                            <div className="flex items-center gap-3 mb-1">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-600">{progress}%</span>
                            </div>

                            {/* Task Count & Members */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-3">
                                    {project._count.tasks} công việc
                                </p>

                                <div className="flex items-center -space-x-2">
                                    {project.members.slice(0, 4).map((member) => (
                                        <div
                                            key={member.user.id}
                                            className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-50"
                                            title={member.user.name}
                                        >
                                            {member.user.avatar ? (
                                                <Image
                                                    src={member.user.avatar}
                                                    alt={member.user.name}
                                                    width={32}
                                                    height={32}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-500">
                                                    {member.user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {project._count.members > 4 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center ring-1 ring-gray-50">
                                            <span className="text-[10px] font-medium text-gray-500">
                                                +{project._count.members - 4}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-auto">
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="block w-full py-2.5 border border-gray-200 rounded-xl text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                >
                                    Vào dự án
                                </Link>

                                {project.isArchived && (
                                    <div className="mt-2 text-center text-xs font-medium text-orange-600 bg-orange-50 py-1 rounded w-full">
                                        Đã lưu trữ
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Tạo dự án mới</h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm font-medium">
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="website-redesign"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !formData.name.trim() || !formData.identifier.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang tạo...' : 'Tạo dự án'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Edit Modal */}
            {
                editingProject && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Chỉnh sửa dự án</h2>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm font-medium">
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
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setEditingProject(null);
                                        setFormData({ name: '', identifier: '', description: '' });
                                        setError('');
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading || !formData.name.trim() || !formData.identifier.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
