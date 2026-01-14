'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tag, Layers, Info, Settings, Save } from 'lucide-react';

import { ProjectTrackerSettings } from '@/components/projects/project-tracker-settings';
import { ProjectIssueSettings } from '@/components/projects/project-issue-settings';

interface Tracker {
    id: string;
    name: string;
    position: number;
    isDefault: boolean;
}



interface Member {
    userId: string;
    user: { id: string; name: string; avatar: string | null };
}

interface ProjectSettingsClientProps {
    projectId: string;
    allTrackers: Tracker[];
    enabledTrackerIds: string[];

    project: {
        name: string;
        description: string | null;
        identifier: string;
    };
    members: Member[];
    issueSettings: {
        parentIssueDates: string;
        parentIssuePriority: string;
        parentIssueDoneRatio: string;
        parentIssueEstimatedHours: string;
    };
    canManage: boolean;
}

export function ProjectSettingsClient({
    projectId,
    allTrackers,
    enabledTrackerIds,
    project,
    members,
    issueSettings,
    canManage,
}: ProjectSettingsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'info' | 'trackers' | 'issue-tracking'>('info');
    const [isSaving, setIsSaving] = useState(false);

    // Project Info State
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description || '',
        identifier: project.identifier,
    });

    const handleSaveInfo = async () => {
        if (!formData.name.trim() || !formData.identifier.trim()) {
            toast.error('Tên và mã định danh không được để trống');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                }),
            });

            if (res.ok) {
                toast.success('Đã cập nhật thông tin dự án');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'info'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Info className="w-4 h-4" />
                        Thông tin
                    </button>
                    <button
                        onClick={() => setActiveTab('trackers')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'trackers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        Trackers
                    </button>

                    <button
                        onClick={() => setActiveTab('issue-tracking')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'issue-tracking'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Cấu hình công việc
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'info' && (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-2xl">
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tên dự án <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    disabled={!canManage}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Mã định danh (Identifier) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-col gap-1">
                                    <input
                                        type="text"
                                        value={formData.identifier}
                                        onChange={(e) => setFormData({ ...formData, identifier: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                                        disabled={!canManage}
                                    />
                                    <p className="text-[11px] text-gray-500">
                                        URL: /projects/{formData.identifier}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Mô tả
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                    disabled={!canManage}
                                />
                            </div>
                        </div>

                        {canManage && (
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleSaveInfo}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'trackers' && (
                    <ProjectTrackerSettings
                        projectId={projectId}
                        allTrackers={allTrackers}
                        enabledTrackerIds={enabledTrackerIds}
                        canManage={canManage}
                    />
                )}



                {activeTab === 'issue-tracking' && (
                    <ProjectIssueSettings
                        projectId={projectId}
                        initialSettings={issueSettings}
                        canManage={canManage}
                    />
                )}
            </div>
        </div>
    );
}
