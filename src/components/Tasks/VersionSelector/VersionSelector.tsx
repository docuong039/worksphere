'use client';

import { useState } from 'react';
import { Milestone, Plus, X, Calendar, CheckCircle, Lock, Unlock, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface Version {
    id: string;
    name: string;
    status: string;
    dueDate?: string | Date | null;
}

interface VersionSelectorProps {
    versions: Version[];
    selectedVersionId?: string | null;
    onChange: (versionId: string | null) => void;
    disabled?: boolean;
    projectId?: string;
    canCreate?: boolean;
    onCreateVersion?: (name: string, dueDate?: string) => Promise<void>;
}

const STATUS_ICONS = {
    open: Unlock,
    locked: Lock,
    closed: CheckCircle,
};

const STATUS_COLORS = {
    open: 'text-green-600 bg-green-50',
    locked: 'text-orange-600 bg-orange-50',
    closed: 'text-gray-500 bg-gray-100',
};

export function VersionSelector({
    versions,
    selectedVersionId,
    onChange,
    disabled = false,
    canCreate = false,
    onCreateVersion,
}: VersionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newVersionName, setNewVersionName] = useState('');
    const [newVersionDueDate, setNewVersionDueDate] = useState('');
    const [creating, setCreating] = useState(false);

    const selectedVersion = versions.find((v) => v.id === selectedVersionId);

    const handleCreate = async () => {
        if (!newVersionName.trim() || !onCreateVersion) return;

        setCreating(true);
        try {
            await onCreateVersion(newVersionName, newVersionDueDate || undefined);
            setNewVersionName('');
            setNewVersionDueDate('');
            setShowCreateForm(false);
        } catch {
            console.error('Create version failed');
        } finally {
            setCreating(false);
        }
    };



    // Group versions by status
    const groupedVersions = {
        open: versions.filter((v) => v.status === 'open'),
        locked: versions.filter((v) => v.status === 'locked'),
        closed: versions.filter((v) => v.status === 'closed'),
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2 
                    border rounded-lg text-left
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
                `}
            >
                <div className="flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-gray-400" />
                    {selectedVersion ? (
                        <>
                            <span className="text-gray-900">{selectedVersion.name}</span>
                            {selectedVersion.dueDate && (
                                <span className="text-xs text-gray-500">
                                    ({formatDate(selectedVersion.dueDate)})
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-500">Chọn phiên bản...</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                        {/* None option */}
                        <button
                            type="button"
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-500 ${!selectedVersionId ? 'bg-blue-50' : ''
                                }`}
                        >
                            — Không chọn —
                        </button>

                        {/* Open versions */}
                        {groupedVersions.open.length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                                    Đang mở
                                </div>
                                {groupedVersions.open.map((version) => (
                                    <VersionOption
                                        key={version.id}
                                        version={version}
                                        isSelected={version.id === selectedVersionId}
                                        onClick={() => {
                                            onChange(version.id);
                                            setIsOpen(false);
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Locked versions */}
                        {groupedVersions.locked.length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                                    Đã khóa
                                </div>
                                {groupedVersions.locked.map((version) => (
                                    <VersionOption
                                        key={version.id}
                                        version={version}
                                        isSelected={version.id === selectedVersionId}
                                        onClick={() => {
                                            onChange(version.id);
                                            setIsOpen(false);
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Closed versions */}
                        {groupedVersions.closed.length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                                    Đã đóng
                                </div>
                                {groupedVersions.closed.map((version) => (
                                    <VersionOption
                                        key={version.id}
                                        version={version}
                                        isSelected={version.id === selectedVersionId}
                                        onClick={() => {
                                            onChange(version.id);
                                            setIsOpen(false);
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Create new */}
                        {canCreate && (
                            <div className="border-t">
                                {showCreateForm ? (
                                    <div className="p-3 space-y-2">
                                        <input
                                            type="text"
                                            value={newVersionName}
                                            onChange={(e) => setNewVersionName(e.target.value)}
                                            placeholder="Tên phiên bản"
                                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <input
                                            type="date"
                                            value={newVersionDueDate}
                                            onChange={(e) => setNewVersionDueDate(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleCreate}
                                                disabled={!newVersionName.trim() || creating}
                                                className="flex-1 px-2 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {creating ? 'Đang tạo...' : 'Tạo'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateForm(false)}
                                                className="px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(true)}
                                        className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tạo phiên bản mới
                                    </button>
                                )}
                            </div>
                        )}

                        {versions.length === 0 && !canCreate && (
                            <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                Chưa có phiên bản nào
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function VersionOption({
    version,
    isSelected,
    onClick,
}: {
    version: Version;
    isSelected: boolean;
    onClick: () => void;
}) {
    const StatusIcon = STATUS_ICONS[version.status as keyof typeof STATUS_ICONS] || Milestone;
    const colorClass = STATUS_COLORS[version.status as keyof typeof STATUS_COLORS] || '';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${isSelected ? 'bg-blue-50' : ''
                }`}
        >
            <div className="flex items-center gap-2">
                <span className={`p-1 rounded ${colorClass}`}>
                    <StatusIcon className="w-3 h-3" />
                </span>
                <span className={version.status === 'closed' ? 'text-gray-500' : 'text-gray-900'}>
                    {version.name}
                </span>
            </div>
            {version.dueDate && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(version.dueDate)}
                </span>
            )}
        </button>
    );
}
