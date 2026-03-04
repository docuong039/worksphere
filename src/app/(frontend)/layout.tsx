import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Middleware đã bảo vệ route, session luôn tồn tại ở đây
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const session = (await auth())!;

    return (
        <div className="h-screen flex overflow-hidden bg-white">
            {/* Sidebar is fixed, so it doesn't take space in the flex flow */}
            <Sidebar user={session.user} />

            {/* Main Content Area */}
            <div
                className="flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-in-out"
                style={{ paddingLeft: 'var(--sidebar-width, 256px)' }}
            >
                <Header user={session.user} />

                {/* Independent Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-gray-50/40">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
