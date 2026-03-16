'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useConfirm } from '@/providers/confirm-provider';
import { trackerService } from '@/api-client/tracker.service';

interface Tracker {
    id: string;
    name: string;
    description: string | null;
    position: number;
    isDefault: boolean;
    _count: {
        tasks: number;
    };
}

interface TrackerListProps {
    trackers: Tracker[];
}

function SortableRow({ tracker, children }: { tracker: Tracker; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tracker.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isDragging ? '#eff6ff' : undefined,
    };
    return (
        <tr ref={setNodeRef} style={style} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-2 text-gray-400 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4" />
            </td>
            {children}
        </tr>
    );
}

export function TrackerList({ trackers: initialTrackers }: TrackerListProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [trackers, setTrackers] = useState(initialTrackers);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = trackers.findIndex((t) => t.id === active.id);
        const newIndex = trackers.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(trackers, oldIndex, newIndex);

        setTrackers(reordered);

        try {
            const items = reordered.map((t, idx) => ({ id: t.id, position: idx + 1 }));
            await trackerService.reorder(items);
            router.refresh();
        } catch {
            setTrackers(trackers);
            toast.error('Không thể cập nhật thứ tự');
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);

        try {
            const response = await trackerService.create(formData);
            setIsAdding(false);
            setFormData({ name: '', description: '' });
            toast.success('Đã tạo tracker mới');
            if (response.data) {
                setTrackers((prev) => [...prev, { ...response.data!, _count: { tasks: 0 } }]);
            }
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);

        const previous = trackers;
        setTrackers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, name: formData.name, description: formData.description || null } : t))
        );
        setEditingId(null);
        setFormData({ name: '', description: '' });

        try {
            await trackerService.update(id, formData);
            router.refresh();
        } catch (error) {
            setTrackers(previous);
            console.error(error);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            toast.error(`Không thể xóa tracker "${name}" đang được sử dụng bởi ${taskCount} công việc`);
            return;
        }

        confirm({
            title: 'Xóa tracker',
            description: `Bạn có chắc muốn xóa tracker "${name}"? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                const previous = trackers;
                setTrackers((prev) => prev.filter((t) => t.id !== id));
                toast.success('Đã xóa tracker');

                try {
                    await trackerService.delete(id);
                    router.refresh();
                } catch (err: any) {
                    setTrackers(previous);
                    toast.error(err.message || 'Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
                }
            },
        });
    };

    const handleSetDefault = async (id: string) => {
        const previous = trackers;
        setTrackers((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));
        try {
            await trackerService.setDefault(id);
            router.refresh();
        } catch (error) {
            setTrackers(previous);
            console.error(error);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        }
    };

    const startEdit = (tracker: Tracker) => {
        setEditingId(tracker.id);
        setFormData({ name: tracker.name, description: tracker.description || '' });
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{trackers.length} trackers</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', description: '' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm loại công việc
                </button>
            </div>

            {/* Table */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="w-10"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số tasks</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mặc định</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                            <tr className="border-b border-gray-200 bg-blue-50">
                                <td></td>
                                <td className="px-6 py-3">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Tên tracker"
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                        autoFocus
                                    />
                                </td>
                                <td className="px-6 py-3">
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Mô tả (tùy chọn)"
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                    />
                                </td>
                                <td></td>
                                <td></td>
                                <td className="px-6 py-3 text-right">
                                    <button
                                        onClick={handleCreate}
                                        disabled={loading || !formData.name.trim()}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 mr-2"
                                    >
                                        Lưu
                                    </button>
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                    >
                                        Hủy
                                    </button>
                                </td>
                            </tr>
                        )}

                        <SortableContext items={trackers.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                            {trackers.map((tracker) => (
                                <SortableRow key={tracker.id} tracker={tracker}>
                                    {editingId === tracker.id ? (
                                        <>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="text"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                                />
                                            </td>
                                            <td></td>
                                            <td></td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleUpdate(tracker.id)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 mr-2"
                                                >
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                                >
                                                    Hủy
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-gray-900">{tracker.name}</span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500">{tracker.description || '-'}</td>
                                            <td className="px-6 py-3 text-center text-gray-500">{tracker._count.tasks}</td>
                                            <td className="px-6 py-3 text-center">
                                                {tracker.isDefault ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                                        <Check className="w-3 h-3" />
                                                        Mặc định
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSetDefault(tracker.id)}
                                                        className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                    >
                                                        Đặt mặc định
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => startEdit(tracker)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 mr-1"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tracker.id, tracker.name, tracker._count.tasks)}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </SortableRow>
                            ))}
                        </SortableContext>

                        {trackers.length === 0 && !isAdding && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    Chưa có tracker nào. Nhấn &quot;Thêm tracker&quot; để tạo mới.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </DndContext>

            {/* Footer hint */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    Kéo thả để thay đổi thứ tự hiển thị
                </p>
            </div>
        </div>
    );
}
