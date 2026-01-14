'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tag, Check } from 'lucide-react';

interface Tracker {
    id: string;
    name: string;
    position: number;
}

interface RoleTrackerPermissionsProps {
    roleId: string;
    roleName: string;
    allTrackers: Tracker[];
    assignedTrackerIds: string[];
}

export function RoleTrackerPermissions({
    roleId,
    roleName,
    allTrackers,
    assignedTrackerIds: initialAssigned,
}: RoleTrackerPermissionsProps) {
    const router = useRouter();
    const [assignedIds, setAssignedIds] = useState<string[]>(initialAssigned);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setAssignedIds(initialAssigned);
    }, [initialAssigned]);

    const handleToggle = (trackerId: string) => {
        setAssignedIds((prev) =>
            prev.includes(trackerId)
                ? prev.filter((id) => id !== trackerId)
                : [...prev, trackerId]
        );
        setSaved(false);
    };

    const handleSelectAll = () => {
        setAssignedIds(allTrackers.map((t) => t.id));
        setSaved(false);
    };

    const handleSelectNone = () => {
        setAssignedIds([]);
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/roles/${roleId}/trackers`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackerIds: assignedIds }),
            });

            if (res.ok) {
                toast.success('Đã lưu cấu hình trackers');
                setSaved(true);
                router.refresh();
                setTimeout(() => setSaved(false), 2000);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = JSON.stringify(assignedIds.sort()) !== JSON.stringify(initialAssigned.sort());

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-900">
                            Trackers cho vai trò: {roleName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            Chọn tất cả
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={handleSelectNone}
                            className="text-sm text-gray-600 hover:text-gray-700"
                        >
                            Bỏ chọn
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Chọn các tracker mà vai trò này được phép sử dụng
                </p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allTrackers.map((tracker) => {
                        const isAssigned = assignedIds.includes(tracker.id);
                        return (
                            <label
                                key={tracker.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isAssigned
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => handleToggle(tracker.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className={`text-sm ${isAssigned ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                                    {tracker.name}
                                </span>
                            </label>
                        );
                    })}
                </div>

                {allTrackers.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                        Chưa có tracker nào trong hệ thống.
                    </p>
                )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                    Đã chọn: {assignedIds.length}/{allTrackers.length} trackers
                </span>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            Đã lưu
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading || !hasChanges}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
