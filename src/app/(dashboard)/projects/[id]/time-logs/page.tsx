'use client';

import { TimeLogsContent } from '@/components/time-logs/time-logs-content';
import { use } from 'react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProjectTimeLogsPage({ params }: PageProps) {
    const { id } = use(params);
    return <TimeLogsContent projectId={id} hideProjectFilter titleSize="md" />;
}
