'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, Plus } from 'lucide-react';
import { TaskContextMenu } from '@/components/Tasks/TaskContextMenu';
import { formatDate } from '@/lib/date-utils';

import { SubtaskWithRelations, Status, Tracker, Priority } from '@/types';

// Removed local interfaces

interface TaskSubtasksProps {
    subtasks: SubtaskWithRelations[];
    projectId: string;
    canEdit: boolean;
    onAddSubtask: () => void;
    statuses: Status[];
    trackers: Tracker[];
    priorities: Priority[];
    canAssignOthers?: boolean;
    currentUserId?: string;
    allowedTrackerIds?: string[];
}

export function TaskSubtasks({
    subtasks,
    projectId,
    canEdit,
    onAddSubtask,
    statuses,
    trackers,
    priorities,
    canAssignOthers,
    currentUserId,
    allowedTrackerIds
}: TaskSubtasksProps) {
    const router = useRouter();
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-800 text-sm">Công việc con</h4>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{subtasks.length}</span>
                </div>
                {canEdit && (
                    <button
                        onClick={onAddSubtask}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" /> Thêm mới
                    </button>
                )}
            </div>

            {subtasks.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-700 bg-gray-50 font-semibold">
                                <th className="px-4 py-3 w-16 text-center">#</th>
                                <th className="px-4 py-3 text-left">Tiêu đề</th>
                                <th className="px-4 py-3 w-28 text-center">Trạng thái</th>
                                <th className="px-4 py-3 w-24 text-center">Bắt đầu</th>
                                <th className="px-4 py-3 w-24 text-center">Kết thúc</th>
                                <th className="px-4 py-3 w-20 text-center">%</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {subtasks.map((sub) => (
                                <tr key={sub.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-600 text-center font-medium">#{sub.number}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                                {sub.tracker.name}
                                            </span>
                                            <Link
                                                href={`/tasks/${sub.id}`}
                                                className={`hover:text-blue-600 font-medium truncate max-w-[300px] transition-colors ${sub.status.isClosed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                                            >
                                                {sub.title}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${sub.status.isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {sub.status.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-700 text-xs">
                                        {formatDate(sub.startDate) || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-700 text-xs">
                                        {formatDate(sub.dueDate) || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-xs font-semibold text-gray-700">{sub.doneRatio || 0}%</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <TaskContextMenu
                                            taskId={sub.id}
                                            taskTitle={sub.title}
                                            projectId={projectId}
                                            currentStatusId={sub.status.id}
                                            currentTrackerId={sub.tracker.id}
                                            currentPriorityId={sub.priority.id}
                                            currentAssigneeId={sub.assignee?.id || null}
                                            currentDoneRatio={sub.doneRatio || 0}
                                            hasSubtasks={false}
                                            isSubtask={true}
                                            canAssignOthers={canAssignOthers}
                                            currentUserId={currentUserId}
                                            allowedTrackerIds={allowedTrackerIds}
                                            statuses={statuses}
                                            trackers={trackers}
                                            priorities={priorities}
                                            onRefresh={() => router.refresh()}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <GitBranch className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm font-medium">Chưa có công việc con</p>
                </div>
            )}
        </div>
    );
}
