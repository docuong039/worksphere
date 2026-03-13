'use client';

import { useState, useEffect, useRef } from 'react';
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
    X,
} from 'lucide-react';
import Image from 'next/image';
import { useConfirm } from '@/providers/confirm-provider';
import type { DateLike } from '@/lib/date-utils';
import { projectService } from '@/api-client/project.service';
import type { ProjectWithMembers as Project } from '@/types';
import { Pagination } from '@/components/UI/Pagination';
import { PaginationResult } from '@/lib/pagination';

interface ProjectListProps {
    initialData: {
        projects: Project[];
        pagination: PaginationResult;
    };
    canCreate?: boolean;
}

export function ProjectList({ initialData, canCreate = false }: ProjectListProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [projects, setProjects] = useState(initialData.projects);
    const [pagination, setPagination] = useState(initialData.pagination);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'archived'>((new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')).get('status') as any || 'active');
    const [search, setSearch] = useState((new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')).get('search') || '');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        identifier: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Sync khi server data thay đổi (vd: từ router.refresh() background)
    useEffect(() => {
        setProjects(initialData.projects);
        setPagination(initialData.pagination);
    }, [initialData]);

    // Debounce timer cho search
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const navigateWithParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(window.location.search);
        for (const [key, value] of Object.entries(updates)) {
            if (value === null) params.delete(key);
            else params.set(key, value);
        }
        router.push(`?${params.toString()}`);
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            navigateWithParams({ search: val || null, page: '1' });
        }, 400);
    };

    const handleFilterChange = (f: 'all' | 'active' | 'archived') => {
        setFilter(f);
        navigateWithParams({ status: f, page: '1' });
    };

    const onPageChange = (newPage: number) => {
        navigateWithParams({ page: newPage.toString() });
    };

    // Create project
    const handleCreate = async () => {
        if (!formData.name.trim() || !formData.identifier.trim()) return;
        setLoading(true);
        setError('');

        try {
            const result = await projectService.create(formData);
            // Optimistic: thêm project mới vào đầu danh sách ngay lập tức
            if (result?.data) {
                const newProject = result.data as Project;
                setProjects((prev) => [newProject, ...prev]);
            }
            setShowCreateModal(false);
            setFormData({ name: '', identifier: '', description: '' });
            toast.success('Đã tạo dự án thành công');
            // Sync lại từ server (background) để lấy data đầy đủ
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
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
            const result = await projectService.update(editingProject.id, formData);
            // Optimistic: cập nhật project trong list ngay lập tức
            setProjects((prev) =>
                prev.map((p) =>
                    p.id === editingProject.id
                        ? { ...p, name: formData.name, identifier: formData.identifier, description: formData.description, ...(result?.data || {}) }
                        : p
                )
            );
            setEditingProject(null);
            setFormData({ name: '', identifier: '', description: '' });
            toast.success('Đã cập nhật dự án thành công');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    // Archive project
    const handleArchive = async (id: string) => {
        // Optimistic: toggle archive ngay lập tức
        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isArchived: !p.isArchived } : p))
        );
        toast.success('Đã cập nhật trạng thái lưu trữ');

        try {
            await projectService.archive(id);
            router.refresh();
        } catch (err) {
            // Rollback nếu lỗi
            setProjects((prev) =>
                prev.map((p) => (p.id === id ? { ...p, isArchived: !p.isArchived } : p))
            );
            console.error(err);
            toast.error('Có lỗi xảy ra khi lưu trữ');
        }
    };

    // Delete project
    const handleDelete = async (project: Project) => {
        confirm({
            title: 'Xóa dự án',
            description: `Bạn có chắc muốn xóa dự án "${project.name}"? Tất cả tasks, comments và dữ liệu liên quan sẽ bị xóa vĩnh viễn!`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa khỏi list ngay lập tức
                const previousProjects = projects;
                setProjects((prev) => prev.filter((p) => p.id !== project.id));
                toast.success('Đã xóa dự án thành công');

                try {
                    await projectService.delete(project.id);
                    router.refresh();
                } catch (err: any) {
                    // Rollback nếu lỗi xóa
                    setProjects(previousProjects);
                    toast.error(err.message || 'Có lỗi xảy ra');
                }
            },
        });
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
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Tìm dự án..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
                        {(['active', 'archived', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
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
                {canCreate && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Tạo dự án mới
                    </button>
                )}
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => {
                    const completedTasks = (project as any).closedTaskCount || 0;
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


            {/* Pagination */}
            <div className="mt-8">
                <Pagination
                    page={pagination.page}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    totalPages={pagination.totalPages}
                    onPageChange={onPageChange}
                />
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <FolderKanban className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có dự án nào</h3>
                    <p className="text-gray-500 mb-6">Tạo dự án đầu tiên để bắt đầu làm việc</p>
                    {canCreate && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            Tạo dự án mới
                        </button>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-bold text-gray-900">Tạo dự án mới</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ name: '', identifier: '', description: '' });
                                    setError('');
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
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
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="VD: Website Redesign, Mobile App..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Định danh (identifier) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.identifier}
                                    onChange={(e) =>
                                        setFormData({ ...formData, identifier: e.target.value.toLowerCase() })
                                    }
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="website-redesign"
                                />
                                <p className="mt-1.5 text-[10px] text-gray-500 font-medium">Định danh duy nhất dùng cho URL dự án</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mô tả dự án</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Mô tả ngắn về mục tiêu dự án..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ name: '', identifier: '', description: '' });
                                    setError('');
                                }}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !formData.name.trim() || !formData.identifier.trim()}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                {loading ? 'Đang tạo...' : 'Tạo dự án'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Edit Modal */}
            {editingProject && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-bold text-gray-900">Chỉnh sửa dự án</h2>
                            <button
                                onClick={() => {
                                    setEditingProject(null);
                                    setFormData({ name: '', identifier: '', description: '' });
                                    setError('');
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
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
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Định danh (identifier) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.identifier}
                                    onChange={(e) =>
                                        setFormData({ ...formData, identifier: e.target.value.toLowerCase() })
                                    }
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mô tả dự án</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setEditingProject(null);
                                    setFormData({ name: '', identifier: '', description: '' });
                                    setError('');
                                }}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={loading || !formData.name.trim() || !formData.identifier.trim()}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
