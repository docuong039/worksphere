'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, RotateCcw, Info } from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import { workflowService } from '@/api-client/workflow.service';
import { WorkflowTransition as Transition, Tracker, Status, Role } from '@/types';

interface WorkflowEditorProps {
    trackers: Tracker[];
    statuses: Status[];
    roles: Role[];
    transitions: (Transition & { trackerId: string; roleId: string | null })[];
}

type TransitionMap = Record<string, boolean>;

export function WorkflowEditor({
    trackers,
    statuses,
    roles,
    transitions: initialTransitions,
}: WorkflowEditorProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [selectedTracker, setSelectedTracker] = useState(trackers[0]?.id || '');
    const [selectedRole, setSelectedRole] = useState<string>(''); // '' = All Roles
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Build transition map from initial data
    const buildTransitionMap = useCallback(
        (trackerId: string, roleId: string | null): TransitionMap => {
            const map: TransitionMap = {};

            initialTransitions
                .filter(
                    (t) =>
                        t.trackerId === trackerId &&
                        (roleId === '' ? t.roleId === null : t.roleId === roleId)
                )
                .forEach((t) => {
                    // Assuming allowed is true if present in this filtered list for the matrix
                    // But wait, the shared type is { fromStatusId, toStatusId, allowed }
                    // We need to map correctly based on how we receive data.
                    // If transitions array contains all possibilities with 'allowed' flag:
                    if (t.allowed) { // This property might not exist on the intersection above unless we clarify
                        map[`${t.fromStatusId}-${t.toStatusId}`] = true;
                    }
                });

            return map;
        },
        [initialTransitions]
    );

    const [transitionMap, setTransitionMap] = useState<TransitionMap>(() =>
        buildTransitionMap(selectedTracker, selectedRole || null)
    );

    // Handle tracker change
    const handleTrackerChange = (trackerId: string) => {
        setSelectedTracker(trackerId);
        setTransitionMap(buildTransitionMap(trackerId, selectedRole || null));
        setSaved(false);
    };

    // Handle role change
    const handleRoleChange = (roleId: string) => {
        setSelectedRole(roleId);
        setTransitionMap(buildTransitionMap(selectedTracker, roleId || null));
        setSaved(false);
    };

    // Toggle transition
    const toggleTransition = (fromStatusId: string, toStatusId: string) => {
        const key = `${fromStatusId}-${toStatusId}`;
        setTransitionMap((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
        setSaved(false);
    };

    // Save workflow
    const handleSave = async () => {
        setLoading(true);

        try {
            const transitions = statuses.flatMap((fromStatus) =>
                statuses
                    .filter((toStatus) => fromStatus.id !== toStatus.id)
                    .map((toStatus) => ({
                        fromStatusId: fromStatus.id,
                        toStatusId: toStatus.id,
                        allowed: !!transitionMap[`${fromStatus.id}-${toStatus.id}`],
                    }))
            );

            await workflowService.update({
                trackerId: selectedTracker,
                roleId: selectedRole || null,
                transitions,
            });

            setSaved(true);
            toast.success('Đã lưu quy trình thành công');
            router.refresh();

            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error(error);
            toast.error('Không thể lưu quy trình công việc. Vui lòng kiểm tra lại kết nối mạng.');
        } finally {
            setLoading(false);
        }
    };

    // Reset to allow all
    const handleReset = () => {
        confirm({
            title: 'Đặt lại quy trình',
            description: 'Bạn có chắc muốn đặt lại về trạng thái cho phép tất cả các chuyển đổi? Các thay đổi chưa lưu sẽ không bị mất cho đến khi bạn nhấn Lưu.',
            confirmText: 'Đặt lại',
            variant: 'warning',
            onConfirm: () => {
                const newMap: TransitionMap = {};
                statuses.forEach((fromStatus) => {
                    statuses.forEach((toStatus) => {
                        if (fromStatus.id !== toStatus.id) {
                            newMap[`${fromStatus.id}-${toStatus.id}`] = true;
                        }
                    });
                });
                setTransitionMap(newMap);
                setSaved(false);
            }
        });
    };


    // Count allowed transitions
    const allowedCount = Object.values(transitionMap).filter(Boolean).length;
    const totalPossible = statuses.length * (statuses.length - 1);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-6">
                    {/* Tracker Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loại công việc
                        </label>
                        <select
                            value={selectedTracker}
                            onChange={(e) => handleTrackerChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {trackers.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vai trò
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả Vai trò</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1"></div>

                    {/* Stats */}
                    <div className="text-sm text-gray-500">
                        {allowedCount} / {totalPossible} chuyển đổi được phép
                    </div>

                    {/* Actions */}
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Đặt lại
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>

                {saved && (
                    <div className="mt-3 text-sm text-green-600">✓ Đã lưu thành công</div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <strong>Hướng dẫn:</strong> Click vào ô để cho phép/không cho phép chuyển đổi trạng thái.
                    <br />
                    • <strong>Hàng</strong>: Trạng thái hiện tại (From)
                    <br />
                    • <strong>Cột</strong>: Trạng thái muốn chuyển đến (To)
                    <br />
                    • <strong>Ô xanh</strong>: Được phép chuyển
                    <br />
                    • <strong>Ô trắng</strong>: Không được phép
                </div>
            </div>

            {/* Matrix */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-r border-gray-200 min-w-[150px]">
                                    From ↓ / To →
                                </th>
                                {statuses.map((status) => (
                                    <th
                                        key={status.id}
                                        className="px-3 py-3 text-center text-xs font-medium text-gray-700 border-b border-r border-gray-200 min-w-[100px]"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{status.name}</span>
                                            {status.isClosed && (
                                                <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded">
                                                    Closed
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {statuses.map((fromStatus) => (
                                <tr key={fromStatus.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-r border-gray-200 bg-gray-50">
                                        <div className="flex items-center gap-2">
                                            <span>{fromStatus.name}</span>
                                            {fromStatus.isClosed && (
                                                <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded">
                                                    Closed
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {statuses.map((toStatus) => {
                                        const isSame = fromStatus.id === toStatus.id;
                                        const isAllowed =
                                            !isSame && transitionMap[`${fromStatus.id}-${toStatus.id}`];

                                        return (
                                            <td
                                                key={toStatus.id}
                                                className={`px-3 py-3 text-center border-b border-r border-gray-200 ${isSame
                                                    ? 'bg-gray-100'
                                                    : isAllowed
                                                        ? 'bg-green-100 cursor-pointer hover:bg-green-200'
                                                        : 'bg-white cursor-pointer hover:bg-gray-100'
                                                    }`}
                                                onClick={() =>
                                                    !isSame && toggleTransition(fromStatus.id, toStatus.id)
                                                }
                                            >
                                                {!isSame && (
                                                    <span
                                                        className={`inline-block w-5 h-5 rounded ${isAllowed ? 'bg-green-500' : 'bg-gray-200'
                                                            }`}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
