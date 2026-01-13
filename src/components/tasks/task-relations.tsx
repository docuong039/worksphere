'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Link2, ArrowRight, Ban, Copy, Calendar } from 'lucide-react';

interface RelatedIssue {
    id: string;
    title: string;
    status: { name: string; isClosed: boolean };
    tracker: { name: string };
}

interface Relation {
    id: string;
    relationType: string;
    relationLabel: string;
    delay?: number | null;
    issue: RelatedIssue;
    direction: 'from' | 'to';
}

interface TaskRelationsProps {
    taskId: string;
    relations: Relation[];
    canEdit: boolean;
    onAddRelation?: (data: { issueToId: string; relationType: string; delay?: number }) => Promise<void>;
    onRemoveRelation?: (relationId: string) => Promise<void>;
    projectMembers?: Array<{ id: string; title: string }>;
}

const RELATION_OPTIONS = [
    { value: 'relates', label: 'Liên quan đến', icon: Link2 },
    { value: 'blocks', label: 'Chặn', icon: Ban },
    { value: 'blocked', label: 'Bị chặn bởi', icon: Ban },
    { value: 'duplicates', label: 'Trùng lặp với', icon: Copy },
    { value: 'precedes', label: 'Đi trước', icon: Calendar },
    { value: 'follows', label: 'Đi sau', icon: Calendar },
];

const RELATION_COLORS: Record<string, string> = {
    relates: 'bg-blue-100 text-blue-700 border-blue-200',
    blocks: 'bg-red-100 text-red-700 border-red-200',
    blocked: 'bg-orange-100 text-orange-700 border-orange-200',
    duplicates: 'bg-purple-100 text-purple-700 border-purple-200',
    duplicated: 'bg-purple-100 text-purple-700 border-purple-200',
    precedes: 'bg-green-100 text-green-700 border-green-200',
    follows: 'bg-teal-100 text-teal-700 border-teal-200',
};

export function TaskRelations({
    taskId,
    relations,
    canEdit,
    onAddRelation,
    onRemoveRelation,
}: TaskRelationsProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<RelatedIssue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<RelatedIssue | null>(null);
    const [relationType, setRelationType] = useState('relates');
    const [delay, setDelay] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`/api/tasks?search=${encodeURIComponent(query)}&pageSize=10`);
            const data = await res.json();
            if (data.success) {
                setSearchResults(
                    data.data.tasks.filter((t: { id: string }) => t.id !== taskId)
                );
            }
        } catch {
            console.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleAddRelation = async () => {
        if (!selectedIssue || !onAddRelation) return;

        setLoading(true);
        try {
            await onAddRelation({
                issueToId: selectedIssue.id,
                relationType,
                delay: ['precedes', 'follows'].includes(relationType) ? delay : undefined,
            });
            setShowAddModal(false);
            setSelectedIssue(null);
            setSearchQuery('');
            setRelationType('relates');
            setDelay(0);
        } catch {
            console.error('Add relation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (relationId: string) => {
        if (!onRemoveRelation) return;
        if (!confirm('Bạn có chắc muốn xóa liên kết này?')) return;

        try {
            await onRemoveRelation(relationId);
        } catch {
            console.error('Remove relation failed');
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Liên kết ({relations.length})
                </h3>
                {canEdit && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm liên kết
                    </button>
                )}
            </div>

            {relations.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Chưa có liên kết nào</p>
            ) : (
                <div className="space-y-2">
                    {relations.map((relation) => (
                        <div
                            key={relation.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                        >
                            <span
                                className={`text-xs px-2 py-0.5 rounded border ${RELATION_COLORS[relation.relationType] || 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                {relation.relationLabel}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <Link
                                href={`/tasks/${relation.issue.id}`}
                                className={`text-sm hover:underline flex-1 ${relation.issue.status.isClosed
                                    ? 'text-gray-500 line-through'
                                    : 'text-gray-900'
                                    }`}
                            >
                                <span className="text-gray-500">[{relation.issue.tracker.name}]</span>{' '}
                                {relation.issue.title}
                            </Link>
                            {relation.delay && (
                                <span className="text-xs text-gray-500">
                                    {relation.delay > 0 ? `+${relation.delay}` : relation.delay} ngày
                                </span>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => handleRemove(relation.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Relation Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Thêm liên kết</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Relation Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại liên kết
                                </label>
                                <select
                                    value={relationType}
                                    onChange={(e) => setRelationType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {RELATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Delay for precedes/follows */}
                            {['precedes', 'follows'].includes(relationType) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Độ trễ (ngày)
                                    </label>
                                    <input
                                        type="number"
                                        value={delay}
                                        onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}

                            {/* Search Task */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tìm công việc
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Nhập từ khóa để tìm..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />

                                {searching && (
                                    <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="mt-2 border rounded-lg max-h-48 overflow-auto">
                                        {searchResults.map((task) => (
                                            <button
                                                key={task.id}
                                                onClick={() => {
                                                    setSelectedIssue(task);
                                                    setSearchResults([]);
                                                    setSearchQuery(task.title);
                                                }}
                                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 ${task.status.isClosed ? 'text-gray-500' : ''
                                                    }`}
                                            >
                                                <span className="text-gray-500 text-sm">
                                                    [{task.tracker.name}]
                                                </span>{' '}
                                                {task.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Issue Preview */}
                            {selectedIssue && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        <span className="font-medium">Đã chọn:</span>{' '}
                                        [{selectedIssue.tracker.name}] {selectedIssue.title}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddRelation}
                                disabled={!selectedIssue || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang thêm...' : 'Thêm liên kết'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
