'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Project {
    id: string;
    name: string;
}

export function DashboardFilter({ projects }: { projects: Project[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentProjectId = searchParams.get('projectId') || '';

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const projectId = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (projectId) {
            params.set('projectId', projectId);
        } else {
            params.delete('projectId');
        }

        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <select
            value={currentProjectId}
            onChange={handleProjectChange}
            style={{ backgroundColor: 'white', color: '#374151' }}
            className="px-3 py-1.5 border border-gray-300 rounded font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[200px] shadow-sm cursor-pointer"
        >
            <option value="">Tất cả dự án</option>
            {projects.map(project => (
                <option key={project.id} value={project.id}>
                    {project.name}
                </option>
            ))}
        </select>
    );
}
