'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    Plus,
    Search,
    Filter,
    ListTodo,
    MessageSquare,
    Save,
    Bookmark,
    LayoutGrid,
    List,
} from 'lucide-react';
import { SavedQueriesList, SaveQueryModal } from '@/components/tasks/saved-queries';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { TaskContextMenu } from '@/components/tasks/task-context-menu';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { taskService } from '@/services/task.service';

import type {
    TaskWithRelations as Task,
    SavedQueryWithRelations, // Changed from SavedQuery
    TaskFilters,
    Tracker,
    Status,
    Priority
} from '@/types';



interface FilterOption {
    id: string;
    name: string;
    color?: string | null;
    isClosed?: boolean;
}

interface TaskListProps {
    initialTasks: Task[];
    trackers: Tracker[];
    statuses: Status[];
    priorities: Priority[];
    projects: Array<{ id: string; name: string; identifier: string }>;
    queries?: SavedQueryWithRelations[]; // Changed from SavedQuery[]
    users?: Array<{ id: string; name: string }>;
    currentUserId?: string;
    allowedTrackerIdsByProject?: Record<string, string[]>;
    projectId?: string; // Add this to lock to a project
}

export function TaskList({
    initialTasks,
    trackers,
    statuses,
    priorities,
    projects,
    queries = [],
    users = [],
    currentUserId,
    allowedTrackerIdsByProject = {},
    projectId: propProjectId,
}: TaskListProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState(initialTasks);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showSavedQueries, setShowSavedQueries] = useState(false);
    const [showSaveQueryModal, setShowSaveQueryModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

    // Search & Filters - must be declared before fetchTasks
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        projectId: propProjectId || '',
        trackerId: '',
        statusId: '',
        priorityId: '',
        assigneeId: '',
        creatorId: '',
        showClosed: false,
        myTasks: false,
        startDateFrom: '',
        startDateTo: '',
        dueDateFrom: '',
        dueDateTo: '',
    });

    // Aggregations
    const [aggregations, setAggregations] = useState({ totalHours: 0 });

    // Fetch tasks with filters - wrapped with useCallback for proper dependency tracking
    const fetchTasks = useCallback(async (filterOverrides?: typeof filters) => {
        setLoading(true);
        const activeFilters = filterOverrides || filters;
        try {
            // Prepare params for taskService
            const params: TaskFilters = {};
            const effectiveProjectId = propProjectId || activeFilters.projectId;
            if (effectiveProjectId) params.projectId = effectiveProjectId;

            if (search) params.search = search;
            if (activeFilters.trackerId) params.trackerId = activeFilters.trackerId;
            if (activeFilters.statusId) params.statusId = activeFilters.statusId;
            if (activeFilters.priorityId) params.priorityId = activeFilters.priorityId;
            if (activeFilters.assigneeId) params.assigneeId = activeFilters.assigneeId;
            if (activeFilters.creatorId) params.creatorId = activeFilters.creatorId;
            // "Hiện đã đóng" = Include closed tasks (show ALL).
            // When unchecked (default): only show open tasks.
            // When checked: show everything (don't send isClosed param).
            if (!activeFilters.showClosed) params.isClosed = 'false';

            if (activeFilters.myTasks) params.my = 'true';
            if (activeFilters.startDateFrom) params.startDateFrom = activeFilters.startDateFrom as string;
            if (activeFilters.startDateTo) params.startDateTo = activeFilters.startDateTo as string;
            if (activeFilters.dueDateFrom) params.dueDateFrom = activeFilters.dueDateFrom as string;
            if (activeFilters.dueDateTo) params.dueDateTo = activeFilters.dueDateTo as string;

            // Jira-style: Board only shows root tasks
            if (viewMode === 'kanban') {
                params.parentId = 'null';
            }

            const response = await taskService.getAll(params);
            if (response.success && response.data) {
                setTasks(response.data.tasks);
                if (response.data.aggregations) {
                    setAggregations(response.data.aggregations);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [filters, propProjectId, search, viewMode]);

    // Refetch when viewMode changes (to apply parentId=null filter for Kanban)
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);
    // Select Query
    const handleSelectQuery = (query: SavedQueryWithRelations) => { // Changed from SavedQuery
        try {
            const parsedFilters = JSON.parse(query.filters);
            const newFilters = {
                projectId: parsedFilters.projectId || '',
                trackerId: parsedFilters.trackerId || '',
                statusId: parsedFilters.statusId || '',
                priorityId: parsedFilters.priorityId || '',
                assigneeId: parsedFilters.assigneeId || '',
                creatorId: parsedFilters.creatorId || '',
                showClosed: parsedFilters.showClosed || false,
                myTasks: parsedFilters.myTasks || false,
                startDateFrom: parsedFilters.startDateFrom || '',
                startDateTo: parsedFilters.startDateTo || '',
                dueDateFrom: parsedFilters.dueDateFrom || '',
                dueDateTo: parsedFilters.dueDateTo || '',
            };
            setFilters(newFilters);
            fetchTasks(newFilters);
            setShowSavedQueries(false);
        } catch (error) {
            console.error('Failed to parse filters', error);
        }
    };



    // Apply filters
    const applyFilters = () => {
        fetchTasks();
        setShowFilters(false);
    };

    // Quick Status Update for Kanban
    const handleStatusChange = async (taskId: string, newStatusId: string) => {
        const newStatus = statuses.find((s) => s.id === newStatusId);
        // Optimistic: di chuyển task sang cột mới ngay lập tức
        const previousTasks = tasks;
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId
                    ? { ...t, statusId: newStatusId, status: { ...t.status, ...(newStatus ? { id: newStatus.id, name: newStatus.name, isClosed: newStatus.isClosed ?? false } : {}) } }
                    : t
            )
        );
        toast.success('Đã cập nhật trạng thái');

        try {
            await taskService.update(taskId, { statusId: newStatusId });
            // Background sync để lấy data chính xác (doneRatio, etc.)
            fetchTasks();
        } catch (err: any) {
            // Rollback nếu lỗi
            setTasks(previousTasks);
            toast.error(err.message || 'Không thể chuyển trạng thái');
        }
    };

    // Clear filters
    const clearFilters = () => {
        const resetFilters = {
            projectId: propProjectId || '',
            trackerId: '',
            statusId: '',
            priorityId: '',
            assigneeId: '',
            creatorId: '',
            showClosed: false,
            myTasks: false,
            startDateFrom: '',
            startDateTo: '',
            dueDateFrom: '',
            dueDateTo: '',
        };
        setFilters(resetFilters);
        setSearch('');
        fetchTasks(resetFilters);
    };



    // Check if any filter is active
    const hasActiveFilters =
        filters.projectId ||
        filters.trackerId ||
        filters.statusId ||
        filters.priorityId ||
        filters.assigneeId ||
        filters.creatorId ||
        filters.showClosed ||
        filters.myTasks ||
        filters.startDateFrom ||
        filters.startDateTo ||
        filters.dueDateFrom ||
        filters.dueDateTo ||
        search;

    // Handle create task with initial data (e.g. from Kanban column)
    const [createModalInitialData, setCreateModalInitialData] = useState<{
        projectId?: string;
        statusId?: string;
    } | undefined>(undefined);

    const handleCreateTask = (statusId?: string) => {
        setCreateModalInitialData({
            projectId: propProjectId,
            statusId,
        });
        setShowCreateModal(true);
    };

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchTasks()}
                            placeholder="Tìm công việc..."
                            className="w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm ${hasActiveFilters
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Lọc
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                    </button>

                    {/* Saved Queries */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSavedQueries(!showSavedQueries)}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 bg-white"
                        >
                            <Bookmark className="w-4 h-4" />
                            <span className="hidden sm:inline">Đã lưu</span>
                        </button>

                        {showSavedQueries && (
                            <div className="absolute top-full mt-1 left-0 sm:left-auto sm:right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                                <SavedQueriesList
                                    queries={queries}
                                    currentUserId={currentUserId || ''}
                                    onSelectQuery={handleSelectQuery}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowSaveQueryModal(true)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 bg-white"
                        title="Lưu bộ lọc hiện tại"
                    >
                        <Save className="w-4 h-4" />
                    </button>

                    {/* Quick Filters */}
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.myTasks}
                            onChange={(e) => {
                                const newFilters = { ...filters, myTasks: e.target.checked };
                                setFilters(newFilters);
                                fetchTasks(newFilters);
                            }}
                            className="w-4 h-4 rounded"
                        />
                        Của tôi
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.showClosed}
                            onChange={(e) => {
                                const newFilters = { ...filters, showClosed: e.target.checked };
                                setFilters(newFilters);
                                fetchTasks(newFilters);
                            }}
                            className="w-4 h-4 rounded"
                        />
                        Hiện đã đóng
                    </label>

                    <div className="h-6 w-px bg-gray-200 mx-2" />

                    {/* View Switcher */}
                    <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Chế độ danh sách"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Chế độ Kanban"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Create Button */}
                <button
                    onClick={() => handleCreateTask()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Tạo công việc
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        {!propProjectId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                                <select
                                    value={filters.projectId}
                                    onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại công việc</label>
                            <select
                                value={filters.trackerId}
                                onChange={(e) => setFilters({ ...filters, trackerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Tất cả</option>
                                {trackers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={filters.statusId}
                                onChange={(e) => setFilters({ ...filters, statusId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Tất cả</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                            <select
                                value={filters.priorityId}
                                onChange={(e) => setFilters({ ...filters, priorityId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Tất cả</option>
                                {priorities.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                            <select
                                value={filters.assigneeId}
                                onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Tất cả</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo</label>
                            <select
                                value={filters.creatorId}
                                onChange={(e) => setFilters({ ...filters, creatorId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Tất cả</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ngày bắt đầu</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={filters.startDateFrom}
                                        onChange={(e) => setFilters({ ...filters, startDateFrom: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Từ"
                                    />
                                    <input
                                        type="date"
                                        value={filters.startDateTo}
                                        onChange={(e) => setFilters({ ...filters, startDateTo: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Đến"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ngày hết hạn</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={filters.dueDateFrom}
                                        onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Từ"
                                    />
                                    <input
                                        type="date"
                                        value={filters.dueDateTo}
                                        onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Đến"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded"
                        >
                            Xóa bộ lọc
                        </button>
                        <button
                            onClick={applyFilters}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded"
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            )}

            {/* Aggregation Info */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <span className="font-medium">Tổng thời gian:</span>
                <span className="font-bold text-gray-900">{aggregations.totalHours ? aggregations.totalHours.toFixed(1) : '0'}h</span>
            </div>

            {/* Task Content: List or Kanban */}
            {
                viewMode === 'list' ? (
                    <div className="bg-white rounded-lg overflow-visible border border-gray-300 shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-300">
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-14">#</th>
                                    {!propProjectId && (
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dự án</th>
                                    )}
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Loại</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-28">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tiêu đề</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Ưu tiên</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Thời gian</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-48">Lịch trình</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                            Đang tải...
                                        </td>
                                    </tr>
                                ) : tasks.length > 0 ? (
                                    tasks.map((task, index) => (
                                        <tr key={task.id} className={`hover:bg-blue-50/50 transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="px-4 py-3 font-semibold text-gray-500 text-center text-xs">
                                                <Link href={`/tasks/${task.id}`} className="hover:text-blue-600">#{task.number}</Link>
                                            </td>
                                            {!propProjectId && (
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/projects/${task.project.id}`}
                                                        className="text-sm font-medium text-gray-700 hover:text-blue-600 truncate block max-w-[150px]"
                                                        title={task.project.name}
                                                    >
                                                        {task.project.name}
                                                    </Link>
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    {task.tracker.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${task.status.isClosed
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-blue-100 text-blue-700 border border-blue-200'}`}
                                                >
                                                    {task.status.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        href={`/tasks/${task.id}`}
                                                        className={`text-sm font-semibold hover:text-blue-600 line-clamp-1 ${task.status.isClosed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                                                    >
                                                        {task.title}
                                                    </Link>
                                                    <div className="flex items-center gap-3">
                                                        {task.assignee && (
                                                            <div className="flex items-center gap-1.5" title={`Được giao cho: ${task.assignee.name}`}>
                                                                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[9px] font-bold text-gray-500 ring-1 ring-white">
                                                                    {task.assignee.avatar ? <Image src={task.assignee.avatar} alt={task.assignee.name} width={20} height={20} className="w-full h-full object-cover" /> : task.assignee.name.charAt(0)}
                                                                </div>
                                                                <span className="text-xs text-gray-600">{task.assignee.name}</span>
                                                            </div>
                                                        )}
                                                        {task._count.comments > 0 && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                {task._count.comments}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                                                    style={{ backgroundColor: task.priority.color || '#6b7280' }}
                                                >
                                                    {task.priority.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-sm font-bold ${task.estimatedHours ? 'text-gray-800' : 'text-gray-300'}`}>
                                                    {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    <span>{task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--'}</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span className={task.dueDate && new Date(task.dueDate) < new Date() && !task.status.isClosed ? 'text-red-600 font-bold' : ''}>
                                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <TaskContextMenu
                                                    taskId={task.id}
                                                    taskTitle={task.title}
                                                    projectId={task.project.id}
                                                    currentStatusId={task.status.id}
                                                    currentTrackerId={task.tracker.id}
                                                    currentPriorityId={task.priority.id}
                                                    currentAssigneeId={task.assignee?.id || null}
                                                    currentDoneRatio={task.doneRatio}
                                                    hasSubtasks={task._count.subtasks > 0}
                                                    statuses={statuses}
                                                    trackers={trackers}
                                                    priorities={priorities}
                                                    onRefresh={() => fetchTasks()}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center">
                                            <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">Chưa có công việc nào</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <KanbanBoard
                        tasks={tasks}
                        statuses={statuses.map(s => ({ ...s, isClosed: s.isClosed ?? false }))}
                        trackers={trackers}
                        priorities={priorities.map(p => ({ ...p, color: p.color ?? null }))}
                        onRefresh={() => fetchTasks()}
                        onStatusChange={handleStatusChange}
                        onCreateTask={handleCreateTask}
                    />
                )
            }


            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                projects={projects}
                trackers={trackers}
                statuses={statuses}
                priorities={priorities}
                versions={[]} // Will be fetched dynamically inside the modal
                initialData={createModalInitialData}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchTasks(); // Client-side refresh ngay lập tức
                }}
                allowedTrackerIdsByProject={allowedTrackerIdsByProject}
            />

            <SaveQueryModal
                isOpen={showSaveQueryModal}
                onClose={() => setShowSaveQueryModal(false)}
                filters={filters}
            />
        </>
    );
}
