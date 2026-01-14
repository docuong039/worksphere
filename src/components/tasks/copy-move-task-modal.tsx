'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Copy, ArrowRightLeft } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    identifier: string;
}

interface CopyMoveTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
    currentProjectId: string;
    mode: 'copy' | 'move';
    projects: Project[];
    hasSubtasks: boolean;
}

export function CopyMoveTaskModal({
    isOpen,
    onClose,
    taskId,
    taskTitle,
    currentProjectId,
    mode,
    projects,
    hasSubtasks,
}: CopyMoveTaskModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [targetProjectId, setTargetProjectId] = useState('');
    const [options, setOptions] = useState({
        copySubtasks: true,
        copyWatchers: false,
        copyAttachments: false,
        linkOriginal: true,
        moveSubtasks: true,
    });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        const endpoint = mode === 'copy' ? `/api/tasks/${taskId}/copy` : `/api/tasks/${taskId}/move`;
        const payload =
            mode === 'copy'
                ? {
                    targetProjectId: targetProjectId || undefined,
                    copySubtasks: options.copySubtasks,
                    copyWatchers: options.copyWatchers,
                    copyAttachments: options.copyAttachments,
                    linkOriginal: options.linkOriginal,
                }
                : {
                    targetProjectId,
                    moveSubtasks: options.moveSubtasks,
                };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json();
                onClose();
                router.refresh();
                if (mode === 'copy') {
                    // Navigate to the new task
                    router.push(`/tasks/${data.id}`);
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    const otherProjects = projects.filter((p) => p.id !== currentProjectId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {mode === 'copy' ? (
                            <Copy className="w-5 h-5 text-blue-600" />
                        ) : (
                            <ArrowRightLeft className="w-5 h-5 text-orange-600" />
                        )}
                        <h3 className="font-medium text-gray-900">
                            {mode === 'copy' ? 'Sao chép công việc' : 'Di chuyển công việc'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Công việc:</p>
                        <p className="font-medium text-gray-900">{taskTitle}</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
                    )}

                    {mode === 'move' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dự án đích *
                            </label>
                            <select
                                value={targetProjectId}
                                onChange={(e) => setTargetProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">-- Chọn dự án --</option>
                                {otherProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {mode === 'copy' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dự án đích (để trống = giữ nguyên)
                            </label>
                            <select
                                value={targetProjectId}
                                onChange={(e) => setTargetProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Giữ nguyên dự án hiện tại</option>
                                {otherProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium text-gray-700">Tùy chọn:</p>

                        {mode === 'copy' && (
                            <>
                                {hasSubtasks && (
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={options.copySubtasks}
                                            onChange={(e) =>
                                                setOptions({ ...options, copySubtasks: e.target.checked })
                                            }
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Sao chép cả công việc con
                                        </span>
                                    </label>
                                )}
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.copyWatchers}
                                        onChange={(e) =>
                                            setOptions({ ...options, copyWatchers: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Sao chép watchers</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.linkOriginal}
                                        onChange={(e) =>
                                            setOptions({ ...options, linkOriginal: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Tạo liên kết với công việc gốc
                                    </span>
                                </label>
                            </>
                        )}

                        {mode === 'move' && hasSubtasks && (
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.moveSubtasks}
                                    onChange={(e) =>
                                        setOptions({ ...options, moveSubtasks: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">
                                    Di chuyển cả công việc con
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (mode === 'move' && !targetProjectId)}
                        className={`px-4 py-2 text-white rounded-md text-sm disabled:opacity-50 ${mode === 'copy'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        {loading
                            ? 'Đang xử lý...'
                            : mode === 'copy'
                                ? 'Sao chép'
                                : 'Di chuyển'}
                    </button>
                </div>
            </div>
        </div>
    );
}
