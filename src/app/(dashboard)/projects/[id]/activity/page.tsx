import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, PlusCircle } from 'lucide-react';

interface Props {
    params: Promise<{ id: string }>;
}

interface TaskActivity {
    id: string;
    number: number;
    title: string;
    description: string | null;
    createdAt: Date;
    creator: {
        id: string;
        name: string;
        avatar: string | null;
    };
    tracker: {
        name: string;
    };
    status: {
        name: string;
    };
}

interface CommentActivity {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
    task: {
        id: string;
        number: number;
        title: string;
        tracker: {
            name: string;
        };
        status: {
            name: string;
        };
    };
}

interface ActivityItem {
    id: string;
    type: 'task' | 'comment';
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

    const canAccess = session.user.isAdministrator || await prisma.projectMember.findFirst({
        where: { userId: session.user.id, projectId: id }
    });
    if (!canAccess) notFound();

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [newTasks, comments] = await Promise.all([
        prisma.task.findMany({
            where: { projectId: id, createdAt: { gt: since } },
            select: {
                id: true,
                number: true,
                title: true,
                description: true,
                createdAt: true,
                creator: { select: { id: true, name: true, avatar: true } },
                tracker: { select: { name: true } },
                status: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },

            take: 50
        }),

        prisma.comment.findMany({
            where: { task: { projectId: id }, createdAt: { gt: since } },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                task: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        tracker: { select: { name: true } },
                        status: { select: { name: true } }
                    }
                }



            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })
    ]) as [TaskActivity[], CommentActivity[]];


    const activities: ActivityItem[] = [
        ...newTasks.map(t => ({
            id: `task-${t.id}`,
            type: 'task' as const,
            date: t.createdAt,
            user: t.creator,
            title: `${t.tracker.name} #${t.number} (${t.status.name}): ${t.title}`,
            description: t.description,
            link: `/tasks/${t.id}`
        })),
        ...comments.map(c => ({

            id: `comment-${c.id}`,
            type: 'comment' as const,
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
                                        {item.type === 'task' ? (
                                            <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                                <PlusCircle className="w-3 h-3" /> Tạo mới
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                                <MessageSquare className="w-3 h-3" /> Bình luận
                                            </span>
                                        )}
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
