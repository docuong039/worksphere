'use client';

import { useState } from 'react';
import { Tag, Layers, Info, Settings } from 'lucide-react';
import { CategoriesManager } from '@/components/projects/categories-manager';
import { ProjectTrackerSettings } from '@/components/projects/project-tracker-settings';
import { ProjectIssueSettings } from '@/components/projects/project-issue-settings';

interface Tracker {
    id: string;
    name: string;
    position: number;
    isDefault: boolean;
}

interface Category {
    id: string;
    name: string;
    assignedTo: { id: string; name: string; avatar: string | null } | null;
    _count: { tasks: number };
}

interface Member {
    userId: string;
    user: { id: string; name: string; avatar: string | null };
}

interface ProjectSettingsClientProps {
    projectId: string;
    allTrackers: Tracker[];
    enabledTrackerIds: string[];
    categories: Category[];
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
    categories,
    members,
    issueSettings,
    canManage,
}: ProjectSettingsClientProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'trackers' | 'categories' | 'issue-tracking'>('trackers');

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
                        onClick={() => setActiveTab('categories')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'categories'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Tag className="w-4 h-4" />
                        Phân loại
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
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin dự án</h3>
                        <p className="text-gray-500">
                            Chức năng chỉnh sửa thông tin dự án đang được cập nhật.
                        </p>
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

                {activeTab === 'categories' && (
                    <CategoriesManager
                        projectId={projectId}
                        initialCategories={categories}
                        members={members}
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
