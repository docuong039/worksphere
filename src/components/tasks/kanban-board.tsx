'use client';

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
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { TaskCard } from './task-card';

interface Task {
    id: string;
    number: number;
    title: string;
    doneRatio: number;
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
    dueDate: any;
}

interface Status {
    id: string;
    name: string;
    isClosed?: boolean;
}

interface KanbanBoardProps {
    tasks: Task[];
    statuses: Status[];
    trackers: any[];
    priorities: any[];
    onRefresh: () => void;
    onStatusChange: (taskId: string, newStatusId: string) => Promise<void>;
}

function KanbanColumn({ status, tasks, trackers, priorities, onRefresh, statuses }: {
    status: Status,
    tasks: Task[],
    trackers: any[],
    priorities: any[],
    onRefresh: () => void,
    statuses: Status[]
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: status.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col w-[300px] min-w-[300px] h-full bg-gray-50/50 rounded-2xl border-2 transition-colors duration-200 ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-transparent'}`}
        >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-gray-700">{status.name}</h3>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 px-2 pb-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        statuses={statuses}
                        trackers={trackers}
                        priorities={priorities}
                        onRefresh={onRefresh}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <span className="text-gray-300 text-xs font-medium">Kéo thả vào đây</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function KanbanBoard({ tasks, statuses, trackers, priorities, onRefresh, onStatusChange }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const activeTask = tasks.find(t => t.id === activeId);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
                        tasks={tasks.filter(t => t.status.id === status.id)}
                        trackers={trackers}
                        priorities={priorities}
                        onRefresh={onRefresh}
                        statuses={statuses}
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
                        tasks={tasks.filter(t => t.status.id === status.id)}
                        trackers={trackers}
                        priorities={priorities}
                        onRefresh={onRefresh}
                        statuses={statuses}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeTask ? (
                    <TaskCard
                        task={activeTask}
                        statuses={statuses}
                        trackers={trackers}
                        priorities={priorities}
                        onRefresh={onRefresh}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
