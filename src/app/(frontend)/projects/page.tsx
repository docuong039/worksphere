import { auth } from '@/lib/auth';
import { ProjectList } from '@/app/(frontend)/projects/components/ProjectList';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';
import { ProjectServerService } from '@/server/services/project.server';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<any> }) {
    const session = await auth();
    const params = await searchParams;

    // Lấy projects thông qua Server Service
    const urlParams = new URLSearchParams();
    if (params.page) urlParams.set('page', params.page);
    if (params.pageSize) urlParams.set('pageSize', params.pageSize);
    if (params.search) urlParams.set('search', params.search);
    if (params.status) urlParams.set('status', params.status);
    if (params.my) urlParams.set('my', params.my);

    const data = session?.user 
        ? await ProjectServerService.getProjects(session.user, urlParams) 
        : { projects: [], pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 } };

    const permissions = session?.user?.id ? await getUserPermissions(session.user.id) : [];
    const canCreate = session?.user ? ProjectPolicy.canCreateProject(session.user as any, permissions) : false;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dự án</h1>
                    <p className="text-gray-500 mt-1">Quản lý các dự án của bạn</p>
                </div>
            </div>

            <ProjectList
                initialData={data as any}
                canCreate={canCreate}
            />
        </div>
    );
}
