'use client';

import { useState } from 'react';
import { Tag, Layers, Settings } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'trackers' | 'issue-tracking'>('trackers');

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
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
