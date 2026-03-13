'use client';

import { useState } from 'react';
import { Layers, Settings } from 'lucide-react';

import { ProjectTrackerSettings } from '@/app/(frontend)/projects/components/ProjectTrackerSettings';

interface Tracker {
    id: string;
    name: string;
    position: number;
    isDefault: boolean;
}
interface ProjectSettingsClientProps {
    projectId: string;
    allTrackers: Tracker[];
    enabledTrackerIds: string[];
    canManage: boolean;
}

export function ProjectSettingsClient({
    projectId,
    allTrackers,
    enabledTrackerIds,
    canManage,
}: ProjectSettingsClientProps) {
    // Only one tab remains, so we can simplify or keep tabs if we plan to add more.
    // For now, let's just render the Tracker Settings directly or keep a simplified structure.
    // Given the user instruction, we should remove the 'issue-tracking' tab.

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900 pb-4">
                    Cấu hình Trackers
                </h3>
            </div>

            <div className="min-h-[400px]">
                <ProjectTrackerSettings
                    projectId={projectId}
                    allTrackers={allTrackers}
                    enabledTrackerIds={enabledTrackerIds}
                    canManage={canManage}
                />
            </div>
        </div>
    );
}
