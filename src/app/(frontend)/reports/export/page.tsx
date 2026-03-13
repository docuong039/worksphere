import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExportClient from '@/app/(frontend)/reports/components/ExportClient';
import { getUserPermissions } from '@/lib/permissions';

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

    const permissions = await getUserPermissions(user.id);

    return <ExportClient user={user} permissions={permissions} />;
}
