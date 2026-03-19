import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExportClient from '@/app/(frontend)/reports/components/ExportClient';
import { getProjectPermissionsMap } from '@/lib/permissions';

export default async function ExportPage() {
    const session = await auth();
    if (!session || !session.user) {
        redirect('/login');
    }

    const user = {
        id: session.user.id,
        name: session.user.name || null,
        isAdministrator: session.user.isAdministrator,
    };

    // Fetch permissions per project — allow the client to compute scope correctly
    // per selected project, rather than using a global union of all memberships.
    const projectPermissionsMap = await getProjectPermissionsMap(user.id);

    return <ExportClient user={user} projectPermissionsMap={projectPermissionsMap} />;
}
