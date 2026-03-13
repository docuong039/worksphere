// global - used in: projects, tasks
import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { TaskCard } from '@/components/Tasks/TaskCard';
import { TaskWithRelations, Status, Tracker, Priority } from '@/types';
import { Plus } from 'lucide-react';
import { PERMISSIONS } from '@/lib/constants';

interface KanbanBoardProps {
    tasks: TaskWithRelations[];
    statuses: Status[];
    trackers: Tracker[];
    priorities: Priority[];
    onRefresh: () => void;
    canAssignOthers?: boolean;
    currentUserId?: string;
    projectPermissionsMap?: Record<string, string[]>;
    allowedTrackerIdsByProject?: Record<string, string[]>;
    onStatusChange: (taskId: string, newStatusId: string) => Promise<void>;
    onCreateTask?: (statusId: string) => void;
}

function KanbanColumn({ status, tasks, trackers, priorities, onRefresh, statuses, onCreateTask, canAssignOthers, currentUserId, projectPermissionsMap, allowedTrackerIdsByProject }: {
    status: Status,
    tasks: TaskWithRelations[],
    trackers: Tracker[],
    priorities: Priority[],
    onRefresh: () => void,
    statuses: Status[],
    onCreateTask?: (statusId: string) => void,
    canAssignOthers?: boolean,
    currentUserId?: string,
    projectPermissionsMap?: Record<string, string[]>,
    allowedTrackerIdsByProject?: Record<string, string[]>
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: status.id,
    });

    // Get column colors based on status name
    const getColumnStyle = () => {
        const statusName = status.name.toLowerCase();

        // New / Mới
        if (statusName.includes('new') || statusName.includes('mới')) {
            return {
                bg: 'bg-sky-50/70',
                border: 'border-sky-200',
                headerBg: 'bg-sky-100/80',
                badge: 'bg-sky-200 text-sky-700',
                text: 'text-sky-800'
            };
        }
        // In Progress / Đang thực hiện
        if (statusName.includes('progress') || statusName.includes('đang') || statusName.includes('doing')) {
            return {
                bg: 'bg-amber-50/70',
                border: 'border-amber-200',
                headerBg: 'bg-amber-100/80',
                badge: 'bg-amber-200 text-amber-700',
                text: 'text-amber-800'
            };
        }
        // Resolved / Hoàn thành / Review
        if (statusName.includes('resolved') || statusName.includes('review') || statusName.includes('done') || statusName.includes('hoàn thành')) {
            return {
                bg: 'bg-emerald-50/70',
                border: 'border-emerald-200',
                headerBg: 'bg-emerald-100/80',
                badge: 'bg-emerald-200 text-emerald-700',
                text: 'text-emerald-800'
            };
        }
        // Closed / Đóng
        if (statusName.includes('closed') || statusName.includes('đóng') || status.isClosed) {
            return {
                bg: 'bg-slate-50/70',
                border: 'border-slate-200',
                headerBg: 'bg-slate-100/80',
                badge: 'bg-slate-200 text-slate-600',
                text: 'text-slate-700'
            };
        }
        // Default
        return {
            bg: 'bg-gray-50/70',
            border: 'border-gray-200',
            headerBg: 'bg-gray-100/80',
            badge: 'bg-gray-200 text-gray-600',
            text: 'text-gray-700'
        };
    };

    const columnStyle = getColumnStyle();

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col w-[300px] min-w-[300px] h-full rounded-2xl border ${columnStyle.bg} ${isOver ? 'border-blue-400 ring-2 ring-blue-200' : columnStyle.border}`}
        >
            {/* Column Header */}
            <div className={`px-4 py-3 rounded-t-2xl ${columnStyle.headerBg}`}>
                <div className="flex items-center justify-between">
                    <h3 className={`text-[13px] font-bold uppercase tracking-wide ${columnStyle.text}`}>{status.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${columnStyle.badge}`}>
                            {tasks.length}
                        </span>
                        {onCreateTask && (
                            <button
                                onClick={() => onCreateTask(status.id)}
                                className={`p-1 rounded-md transition-colors hover:bg-white/50 ${columnStyle.text} opacity-60 hover:opacity-100`}
                                title="Tạo công việc mới"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 px-2 py-3 space-y-3 overflow-y-auto scrollbar-none flex flex-col">
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        statuses={statuses}
                        trackers={trackers}
                        priorities={priorities}
                        canAssignOthers={canAssignOthers || projectPermissionsMap?.[task.projectId]?.includes(PERMISSIONS.TASKS.ASSIGN_OTHERS)}
                        currentUserId={currentUserId}
                        allowedTrackerIds={allowedTrackerIdsByProject?.[task.projectId]}
                        onRefresh={onRefresh}
                    />
                ))}

            </div>
        </div>
    );
}

export function KanbanBoard({ tasks, statuses, trackers, priorities, canAssignOthers, currentUserId, projectPermissionsMap, allowedTrackerIdsByProject, onRefresh, onStatusChange, onCreateTask }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // CHỈ HIỂN THỊ CÁC TASK GỐC TRÊN BẢNG KANBAN (Ẩn subtask để nó chỉ nằm trong card cha)
    const topLevelTasks = tasks.filter(t => t.parentId === null);

    useEffect(() => {
        // eslint-disable-next-line
        setIsMounted(true);
    }, []);

    const activeTask = topLevelTasks.find(t => t.id === activeId);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(PointerSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatusId = over.id as string;

        const task = tasks.find(t => t.id === taskId);
        if (task && task.status.id !== newStatusId) {
            await onStatusChange(taskId, newStatusId);
        }
    };

    if (!isMounted) {
        return (
            <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px] overflow-x-auto pb-4 px-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {statuses.map(status => (
                    <KanbanColumn
                        key={status.id}
                        status={status}
                        tasks={topLevelTasks.filter(t => t.status.id === status.id)}
                        trackers={trackers}
                        priorities={priorities}
                        onRefresh={onRefresh}
                        statuses={statuses}
                        onCreateTask={onCreateTask}
                        canAssignOthers={canAssignOthers}
                        currentUserId={currentUserId}
                        projectPermissionsMap={projectPermissionsMap}
                        allowedTrackerIdsByProject={allowedTrackerIdsByProject}
                    />
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px] overflow-x-auto pb-4 px-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {statuses.map(status => (
                    <KanbanColumn
                        key={status.id}
                        status={status}
                        tasks={topLevelTasks.filter(t => t.status.id === status.id)}
                        trackers={trackers}
                        priorities={priorities}
                        onRefresh={onRefresh}
                        statuses={statuses}
                        onCreateTask={onCreateTask}
                        canAssignOthers={canAssignOthers}
                        currentUserId={currentUserId}
                        projectPermissionsMap={projectPermissionsMap}
                        allowedTrackerIdsByProject={allowedTrackerIdsByProject}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <TaskCard
                        task={activeTask}
                        statuses={statuses}
                        trackers={trackers}
                        priorities={priorities}
                        canAssignOthers={canAssignOthers || projectPermissionsMap?.[activeTask.projectId]?.includes(PERMISSIONS.TASKS.ASSIGN_OTHERS)}
                        currentUserId={currentUserId}
                        allowedTrackerIds={allowedTrackerIdsByProject?.[activeTask.projectId]}
                        onRefresh={onRefresh}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
