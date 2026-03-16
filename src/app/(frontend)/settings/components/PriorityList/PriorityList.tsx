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
import { priorityService } from '@/api-client/priority.service';

interface Priority {
    id: string;
    name: string;
    position: number;
    color: string | null;
    isDefault: boolean;
    _count: {
        tasks: number;
    };
}

interface PriorityListProps {
    priorities: Priority[];
}

const COLORS = [
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
];

function SortableRow({ priority, children }: { priority: Priority; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: priority.id });
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

export function PriorityList({ priorities: initialPriorities }: PriorityListProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [priorities, setPriorities] = useState(initialPriorities);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', color: '#3b82f6' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = priorities.findIndex((p) => p.id === active.id);
        const newIndex = priorities.findIndex((p) => p.id === over.id);
        const reordered = arrayMove(priorities, oldIndex, newIndex);

        setPriorities(reordered);

        try {
            const items = reordered.map((p, idx) => ({ id: p.id, position: idx + 1 }));
            await priorityService.reorder(items);
            router.refresh();
        } catch {
            setPriorities(priorities);
            toast.error('Không thể cập nhật thứ tự');
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            const response = await priorityService.create(formData);
            setIsAdding(false);
            setFormData({ name: '', color: '#3b82f6' });
            toast.success('Đã tạo priority mới');
            if (response.data) {
                setPriorities((prev) => [...prev, { ...response.data!, _count: { tasks: 0 } }]);
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        const previous = priorities;
        setPriorities((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name: formData.name, color: formData.color } : p))
        );
        setEditingId(null);
        setFormData({ name: '', color: '#3b82f6' });

        try {
            await priorityService.update(id, formData);
            router.refresh();
        } catch (err: any) {
            setPriorities(previous);
            setError(err.message || 'Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string, taskCount: number) => {
        if (taskCount > 0) {
            toast.error(`Không thể xóa priority "${name}" đang được sử dụng bởi ${taskCount} công việc`);
            return;
        }

        confirm({
            title: 'Xóa mức độ ưu tiên',
            description: `Bạn có chắc muốn xóa mức độ ưu tiên "${name}"? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                const previous = priorities;
                setPriorities((prev) => prev.filter((p) => p.id !== id));
                toast.success('Đã xóa priority');

                try {
                    await priorityService.delete(id);
                    router.refresh();
                } catch (err: any) {
                    setPriorities(previous);
                    toast.error(err.message || 'Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
                }
            },
        });
    };

    const handleSetDefault = async (id: string) => {
        const previous = priorities;
        setPriorities((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
        try {
            await priorityService.setDefault(id);
            router.refresh();
        } catch (err) {
            setPriorities(previous);
            console.error(err);
            toast.error('Không thể xử lý dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        }
    };

    const startEdit = (priority: Priority) => {
        setEditingId(priority.id);
        setFormData({ name: priority.name, color: priority.color || '#3b82f6' });
        setError('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{priorities.length} priorities</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', color: '#3b82f6' });
                        setError('');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm độ ưu tiên
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="w-10"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Màu sắc</th>
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
                                        placeholder="Tên priority"
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                        autoFocus
                                    />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setFormData({ ...formData, color: c.value })}
                                                className={`w-6 h-6 rounded-full border-2 ${formData.color === c.value ? 'border-gray-900' : 'border-transparent'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
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

                        <SortableContext items={priorities.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                            {priorities.map((priority) => (
                                <SortableRow key={priority.id} priority={priority}>
                                    {editingId === priority.id ? (
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
                                                <div className="flex items-center gap-2">
                                                    {COLORS.map((c) => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => setFormData({ ...formData, color: c.value })}
                                                            className={`w-6 h-6 rounded-full border-2 ${formData.color === c.value ? 'border-gray-900' : 'border-transparent'}`}
                                                            style={{ backgroundColor: c.value }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td></td>
                                            <td></td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleUpdate(priority.id)}
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
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: priority.color || '#6b7280' }}
                                                    />
                                                    <span className="font-medium text-gray-900">{priority.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span
                                                    className="inline-block px-2 py-1 rounded text-xs text-white"
                                                    style={{ backgroundColor: priority.color || '#6b7280' }}
                                                >
                                                    {priority.color || '#6b7280'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center text-gray-500">{priority._count.tasks}</td>
                                            <td className="px-6 py-3 text-center">
                                                {priority.isDefault ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                                        <Check className="w-3 h-3" />
                                                        Mặc định
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSetDefault(priority.id)}
                                                        className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                    >
                                                        Đặt mặc định
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => startEdit(priority)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 mr-1"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(priority.id, priority.name, priority._count.tasks)}
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

                        {priorities.length === 0 && !isAdding && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    Chưa có priority nào. Nhấn &quot;Thêm priority&quot; để tạo mới.
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
