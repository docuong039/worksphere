import { auth } from '@/lib/auth';
import { ProjectList } from '@/components/projects/project-list';
import { ProjectWithMembers } from '@/types';
import { getUserPermissions } from '@/lib/permissions';
import * as ProjectPolicy from '@/server/policies/project.policy';
import { ProjectServerService } from '@/server/services/project.server';

export default async function ProjectsPage() {
    const session = await auth();

    // Lấy projects thông qua Server Service thay vì chọc thẳng vào DB
    const projects = session?.user ? await ProjectServerService.getProjects(session.user, {}) : [];

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
                projects={projects as unknown as ProjectWithMembers[]}
                canCreate={canCreate}
            />
        </div>
    );
}
