'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tag, Check } from 'lucide-react';

interface Tracker {
    id: string;
    name: string;
    position: number;
    isDefault: boolean;
}

interface ProjectTrackerSettingsProps {
    projectId: string;
    allTrackers: Tracker[];
    enabledTrackerIds: string[];
    canManage: boolean;
}

export function ProjectTrackerSettings({
    projectId,
    allTrackers,
    enabledTrackerIds: initialEnabled,
    canManage,
}: ProjectTrackerSettingsProps) {
    const router = useRouter();
    const [enabledIds, setEnabledIds] = useState<string[]>(initialEnabled);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setEnabledIds(initialEnabled);
    }, [initialEnabled]);

    const handleToggle = (trackerId: string) => {
        if (!canManage) return;
        setEnabledIds((prev) =>
            prev.includes(trackerId)
                ? prev.filter((id) => id !== trackerId)
                : [...prev, trackerId]
        );
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/trackers`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackerIds: enabledIds }),
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

    const hasChanges = JSON.stringify(enabledIds.sort()) !== JSON.stringify(initialEnabled.sort());

    // If no trackers are specifically enabled, all are available
    const allEnabled = enabledIds.length === 0;

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Trackers của dự án</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    {allEnabled
                        ? 'Tất cả trackers đều khả dụng (chưa cấu hình riêng)'
                        : `${enabledIds.length} trackers được bật`}
                </p>
            </div>

            <div className="p-6">
                <div className="space-y-2">
                    {allTrackers.map((tracker) => {
                        const isEnabled = allEnabled || enabledIds.includes(tracker.id);
                        return (
                            <label
                                key={tracker.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isEnabled
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200'
                                    } ${!canManage ? 'cursor-default' : 'hover:shadow-sm'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => handleToggle(tracker.id)}
                                    disabled={!canManage}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600"
                                />
                                <div className="flex-1">
                                    <span className={`font-medium ${isEnabled ? 'text-green-900' : 'text-gray-500'}`}>
                                        {tracker.name}
                                    </span>
                                    {tracker.isDefault && (
                                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                            Mặc định
                                        </span>
                                    )}
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            {canManage && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                    {saved && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            Đã lưu
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading || !hasChanges}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            )}
        </div>
    );
}
