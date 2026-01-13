'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Search,
    Filter,
    ListTodo,
    MessageSquare,
    GitBranch,
    X,
    ChevronDown,
    Save,
    Bookmark,
    LayoutGrid,
    List,
} from 'lucide-react';
import type { DateLike } from '@/lib/types';
import { SavedQueriesList, SaveQueryModal } from './saved-queries';
import { CreateTaskModal } from './create-task-modal';
import { TaskContextMenu } from './task-context-menu';
import { KanbanBoard } from './kanban-board';

interface Query {
    id: string;
    name: string;
    isPublic: boolean;
    filters: string;
    columns: string | null;
    sortBy: string | null;
    sortOrder: string | null;
    groupBy: string | null;
    user: { id: string; name: string };
    project: { id: string; name: string; identifier: string } | null;
}

interface Task {
    id: string;
    number: number;
    title: string;
    startDate: DateLike | null;
    dueDate: DateLike | null;
    doneRatio: number;
    estimatedHours: number | null;
    totalSpentHours?: number;
    tracker: { id: string; name: string };
    status: { id: string; name: string; isClosed: boolean };
    priority: { id: string; name: string; color: string | null };
    project: { id: string; name: string; identifier: string };
    assignee: { id: string; name: string; avatar: string | null } | null;
    parent: { id: string; number: number; title: string } | null;
    subtasks?: Array<{
        id: string;
        number: number;
        title: string;
        status: { id: string; name: string; isClosed: boolean };
        assignee: { id: string; name: string; avatar: string | null } | null;
    }>;
    _count: { subtasks: number; comments: number };
}


interface FilterOption {
    id: string;
    name: string;
    color?: string | null;
    isClosed?: boolean;
}

interface TaskListProps {
    initialTasks: Task[];
    trackers: FilterOption[];
    statuses: FilterOption[];
    priorities: FilterOption[];
    projects: Array<{ id: string; name: string; identifier: string }>;
    queries?: Query[];
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

    // Refetch when viewMode changes (to apply parentId=null filter for Kanban)
    useEffect(() => {
        fetchTasks();
    }, [viewMode]);

    // Search & Filters
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
    });

    // Fetch tasks with filters
    const fetchTasks = async (filterOverrides?: typeof filters) => {
        setLoading(true);
        const activeFilters = filterOverrides || filters;
        try {
            const params = new URLSearchParams();
            const effectiveProjectId = propProjectId || activeFilters.projectId;
            if (effectiveProjectId) params.set('projectId', effectiveProjectId);

            if (search) params.set('search', search);
            if (activeFilters.trackerId) params.set('trackerId', activeFilters.trackerId);
            if (activeFilters.statusId) params.set('statusId', activeFilters.statusId);
            if (activeFilters.priorityId) params.set('priorityId', activeFilters.priorityId);
            if (activeFilters.assigneeId) params.set('assigneeId', activeFilters.assigneeId);
            if (activeFilters.creatorId) params.set('creatorId', activeFilters.creatorId);
            if (!activeFilters.showClosed) params.set('isClosed', 'false');
            if (activeFilters.myTasks) params.set('my', 'true');

            // Jira-style: Board only shows root tasks
            if (viewMode === 'kanban') {
                params.set('parentId', 'null');
            }

            const res = await fetch(`/api/tasks?${params.toString()}`);
            const data = await res.json();
            setTasks(data.data.tasks);
        } finally {
            setLoading(false);
        }
    };

    // Select Query
    const handleSelectQuery = (query: Query) => {
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
            };
            setFilters(newFilters);
            fetchTasks(newFilters);
            setShowSavedQueries(false);
        } catch (error) {
            console.error('Failed to parse filters', error);
        }
    };

    // Save Query
    const handleSaveQuery = async (data: any) => {
        try {
            const res = await fetch('/api/queries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    filters: JSON.stringify(filters),
                }),
            });
            if (res.ok) {
                setShowSaveQueryModal(false);
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Apply filters
    const applyFilters = () => {
        fetchTasks();
        setShowFilters(false);
    };

    // Quick Status Update for Kanban
    const handleStatusChange = async (taskId: string, newStatusId: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statusId: newStatusId }),
            });
            if (res.ok) {
                fetchTasks();
            } else {
                const data = await res.json();
                alert(data.error || 'Không thể chuyển trạng thái');
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            projectId: '',
            trackerId: '',
            statusId: '',
            priorityId: '',
            assigneeId: '',
            creatorId: '',
            showClosed: false,
            myTasks: false,
        });
        setSearch('');
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
        search;

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
                    onClick={() => setShowCreateModal(true)}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tracker</label>
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

            {/* Task Content: List or Kanban */}
            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-12 text-center">#</th>
                                {!propProjectId && (
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dự án</th>
                                )}
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracker</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiêu đề công việc</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ưu tiên</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lịch trình</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-gray-400 text-center">
                                            <Link href={`/tasks/${task.id}`}>#{task.number}</Link>
                                        </td>
                                        {!propProjectId && (
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/projects/${task.project.id}`}
                                                    className="text-sm font-semibold text-gray-700 hover:text-blue-600 truncate block max-w-[150px]"
                                                    title={task.project.name}
                                                >
                                                    {task.project.name}
                                                </Link>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {task.tracker.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider ${task.status.isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                                            >
                                                {task.status.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <Link
                                                    href={`/tasks/${task.id}`}
                                                    className={`text-sm font-semibold hover:text-blue-600 ${task.status.isClosed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                                                >
                                                    {task.title}
                                                </Link>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {task.assignee && (
                                                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                            <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[8px] font-bold">
                                                                {task.assignee.avatar ? <img src={task.assignee.avatar} alt="" /> : task.assignee.name.charAt(0)}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 font-medium">{task.assignee.name}</span>
                                                        </div>
                                                    )}
                                                    {task._count.comments > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                            <MessageSquare className="w-3 h-3" />
                                                            {task._count.comments}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className="text-[10px] font-black px-2 py-0.5 rounded text-white uppercase"
                                                style={{ backgroundColor: task.priority.color || '#6b7280' }}
                                            >
                                                {task.priority.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {task.totalSpentHours ? `${task.totalSpentHours.toFixed(1)}h` : '0h'}
                                                </span>
                                                {task.estimatedHours && (
                                                    <span className="text-[10px] text-gray-400 font-medium italic">Ước tính: {task.estimatedHours}h</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-medium text-gray-600 bg-gray-50 border border-gray-100 px-1.5 rounded">
                                                    {task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '---'}
                                                </span>
                                                <div className="w-px h-2 bg-gray-200" />
                                                <span className={`text-[10px] font-bold px-1.5 rounded ${task.dueDate && new Date(task.dueDate) < new Date() && !task.status.isClosed ? 'text-red-600 bg-red-50 border border-red-100' : 'text-gray-600 bg-gray-50 border border-gray-100'}`}>
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '---'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <TaskContextMenu
                                                taskId={task.id}
                                                projectId={task.project.id}
                                                currentStatusId={task.status.id}
                                                currentTrackerId={task.tracker.id}
                                                currentPriorityId={task.priority.id}
                                                currentAssigneeId={task.assignee?.id || null}
                                                currentDoneRatio={0}
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
                                        <p className="text-gray-500">Chưa có công việc nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <KanbanBoard
                    tasks={tasks as any}
                    statuses={statuses}
                    trackers={trackers}
                    priorities={priorities}
                    onRefresh={() => fetchTasks()}
                    onStatusChange={handleStatusChange}
                />
            )}


            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                projects={projects}
                trackers={trackers}
                statuses={statuses}
                priorities={priorities}
                versions={[]} // Will be fetched dynamically inside the modal
                onSuccess={() => {
                    setShowCreateModal(false);
                    router.refresh();
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
