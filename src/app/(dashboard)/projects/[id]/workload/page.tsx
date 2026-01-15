'use client';

import { WorkloadContent } from '@/components/workload/workload-content';
import { use } from 'react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProjectWorkloadPage({ params }: PageProps) {
    const { id } = use(params);
    return <WorkloadContent projectId={id} hideProjectFilter titleSize="md" />;
}
