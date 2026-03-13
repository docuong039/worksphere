import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, PlusCircle } from 'lucide-react';
import { ProjectServerService } from '@/server/services/project.server';

interface Props {
    params: Promise<{ id: string }>;
}

interface ActivityItem {
    id: string;
    type: 'task' | 'comment';
    action: string;
    actionLabel: string;
    date: Date;
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
    title: string;
    description: string | null;
    link: string;
}

export default async function ProjectActivityPage({ params }: Props) {
    const session = await auth();
    const { id } = await params;

    if (!session) redirect('/login');

    const canAccess = await ProjectServerService.checkAccess(session.user, id);
    if (!canAccess) notFound();

    const project = await ProjectServerService.getProjectDetails(id);
    if (!project) notFound();

    const { auditLogs, comments, taskMap } = await ProjectServerService.getActivityLogs(id);

    const activities: ActivityItem[] = [
        ...auditLogs.map(log => {
            let title = '';
            let link = '';

            if (log.entityType === 'task') {
                const task = taskMap.get(log.entityId);
                if (task) {
                    title = `${task.tracker.name} #${task.number}: ${task.title}`;
                    link = `/tasks/${task.id}`;
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const changes = log.changes as any;
                    const oldTitle = changes?.old?.title || changes?.new?.title || 'Công việc';
                    title = `Công việc: ${oldTitle}`;
                    link = '#';
                }
            } else {
                title = `Dự án: ${project.name}`;
                link = `/projects/${project.id}`;
            }

            const actionLabel = log.action === 'created' ? 'Tạo mới' : log.action === 'updated' ? 'Cập nhật' : 'Xóa';

            return {
                id: log.id,
                type: 'task' as const,
                action: log.action,
                actionLabel,
                date: log.createdAt,
                user: log.user,
                title: title,
                description: null,
                link: link
            };
        }),
        ...comments.map(c => ({
            id: `comment-${c.id}`,
            type: 'comment' as const,
            action: 'commented',
            actionLabel: 'Bình luận',
            date: c.createdAt,
            user: c.user,
            title: `${c.task.tracker.name} #${c.task.number}: ${c.task.title}`,
            description: c.content,
            link: `/tasks/${c.task.id}#comment-${c.id}`
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Group by Date
    const grouped: Record<string, ActivityItem[]> = {};
    activities.forEach(act => {
        const key = format(act.date, 'yyyy-MM-dd');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(act);
    });

    const sortedDates = Object.keys(grouped).sort().reverse();

    return (
        <div className="space-y-6">
            {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                    <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-1">
                        {format(new Date(dateKey), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </h3>
                    <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-2">
                        {grouped[dateKey].map(item => (
                            <div key={item.id} className="flex gap-3 relative">
                                <div className="absolute -left-[25px] mt-1 w-3 h-3 rounded-full bg-gray-200 border-2 border-white"></div>
                                <Avatar className="w-6 h-6 mt-0.5">
                                    <AvatarImage src={item.user.avatar || undefined} />
                                    <AvatarFallback className="text-xs">{item.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                                        <span className="font-medium text-gray-900">{item.user.name}</span>
                                        <span>{format(item.date, 'HH:mm')}</span>
                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${item.action === 'created' ? 'bg-green-100 text-green-700' :
                                            item.action === 'updated' ? 'bg-amber-100 text-amber-700' :
                                                item.action === 'deleted' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.action === 'created' ? <PlusCircle className="w-3 h-3" /> :
                                                item.action === 'commented' ? <MessageSquare className="w-3 h-3" /> : null}
                                            {item.actionLabel}
                                        </span>
                                    </div>
                                    <Link href={item.link} className="text-blue-600 hover:underline font-medium block">
                                        {item.title}
                                    </Link>
                                    {item.description && (
                                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {item.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {activities.length === 0 && (
                <div className="text-center text-gray-500 py-10">Chưa có hoạt động nào trong 30 ngày qua.</div>
            )}
        </div>
    );
}
