import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReportClient from '@/app/(frontend)/reports/components/ReportClient';
import { getUserPermissions } from '@/lib/permissions';

export default async function ReportsPage() {
    // 1. Kiểm tra xác thực ở Server (Chuẩn bảo mật)
    const session = await auth();
    if (!session || !session.user) {
        redirect('/login');
    }

    const user = {
        id: session.user.id,
        name: session.user.name || null,
        isAdministrator: session.user.isAdministrator,
    };

    // 2. Lấy quyền hạn ở Server để truyền cho Client Policy
    const permissions = await getUserPermissions(user.id);

    // 3. Render Client Component với dữ liệu quyền hạn đã có
    return <ReportClient user={user} permissions={permissions} />;
}
