'use client';

import { TimeLogsContent } from '@/components/time-logs/time-logs-content';

interface ProjectTimeSummaryProps {
    projectId: string;
}

export function ProjectTimeSummary({ projectId }: ProjectTimeSummaryProps) {
    return (
        <div className="bg-gray-50/50 p-4 rounded-lg">
            <TimeLogsContent projectId={projectId} hideProjectFilter titleSize="sm" />
        </div>
    );
}
