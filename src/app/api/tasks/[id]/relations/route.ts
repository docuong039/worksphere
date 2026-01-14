import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { createIssueRelationSchema } from '@/lib/validations';

interface Params {
    params: Promise<{ id: string }>;
}

const RELATION_LABELS: Record<string, string> = {
    relates: 'Liên quan đến',
    duplicates: 'Trùng lặp với',
    duplicated: 'Được nhân bản từ',
    blocks: 'Chặn',
    blocked: 'Bị chặn bởi',
    precedes: 'Đi trước',
    follows: 'Đi sau',
    copied_to: 'Được copy sang',
    copied_from: 'Copy từ',
};

const REVERSE_RELATIONS: Record<string, string> = {
    relates: 'relates',
    duplicates: 'duplicated',
    duplicated: 'duplicates',
    blocks: 'blocked',
    blocked: 'blocks',
    precedes: 'follows',
    follows: 'precedes',
    copied_to: 'copied_from',
    copied_from: 'copied_to',
};

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: taskId } = await params;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { projectId: true },
        });

        if (!task) {
            return errorResponse('Task không tồn tại', 404);
        }

        const canAccess =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: task.projectId },
            }));

        if (!canAccess) {
            return errorResponse('Không có quyền truy cập', 403);
        }

        const [relationsFrom, relationsTo] = await Promise.all([
            prisma.issueRelation.findMany({
                where: { issueFromId: taskId },
                include: {
                    issueTo: {
                        select: {
                            id: true,
                            title: true,
                            status: { select: { name: true, isClosed: true } },
                            tracker: { select: { name: true } },
                        },
                    },
                },
            }),
            prisma.issueRelation.findMany({
                where: { issueToId: taskId },
                include: {
                    issueFrom: {
                        select: {
                            id: true,
                            title: true,
                            status: { select: { name: true, isClosed: true } },
                            tracker: { select: { name: true } },
                        },
                    },
                },
            }),
        ]);

        const relations = [
            ...relationsFrom.map((r) => ({
                id: r.id,
                relationType: r.relationType,
                relationLabel: RELATION_LABELS[r.relationType] || r.relationType,
                delay: r.delay,
                issue: r.issueTo,
                direction: 'from' as const,
            })),
            ...relationsTo.map((r) => ({
                id: r.id,
                relationType: REVERSE_RELATIONS[r.relationType] || r.relationType,
                relationLabel: RELATION_LABELS[REVERSE_RELATIONS[r.relationType]] || r.relationType,
                delay: r.delay,
                issue: r.issueFrom,
                direction: 'to' as const,
            })),
        ];

        return successResponse(relations);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();

        if (!session) {
            return errorResponse('Chưa đăng nhập', 401);
        }

        const { id: issueFromId } = await params;

        const sourceTask = await prisma.task.findUnique({
            where: { id: issueFromId },
            select: { projectId: true },
        });

        if (!sourceTask) {
            return errorResponse('Task không tồn tại', 404);
        }

        const canEdit =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: {
                    userId: session.user.id,
                    projectId: sourceTask.projectId,
                    role: {
                        permissions: {
                            some: {
                                permission: { key: { in: ['tasks.edit_any', 'tasks.manage_relations'] } },
                            },
                        },
                    },
                },
            }));

        if (!canEdit) {
            return errorResponse('Không có quyền thêm liên kết', 403);
        }

        const body = await req.json();
        const validatedData = createIssueRelationSchema.parse(body);

        if (validatedData.issueToId === issueFromId) {
            return errorResponse('Không thể tạo liên kết với chính nó', 400);
        }

        const targetTask = await prisma.task.findUnique({
            where: { id: validatedData.issueToId },
            select: { id: true },
        });

        if (!targetTask) {
            return errorResponse('Task đích không tồn tại', 404);
        }

        const existingRelation = await prisma.issueRelation.findFirst({
            where: {
                OR: [
                    { issueFromId, issueToId: validatedData.issueToId },
                    { issueFromId: validatedData.issueToId, issueToId: issueFromId },
                ],
            },
        });

        if (existingRelation) {
            return errorResponse('Đã tồn tại liên kết giữa hai task này', 400);
        }

        const relation = await prisma.issueRelation.create({
            data: {
                issueFromId,
                issueToId: validatedData.issueToId,
                relationType: validatedData.relationType,
                delay: validatedData.delay,
            },
            include: {
                issueTo: {
                    select: {
                        id: true,
                        title: true,
                        status: { select: { name: true, isClosed: true } },
                        tracker: { select: { name: true } },
                    },
                },
            },
        });

        return successResponse(
            {
                id: relation.id,
                relationType: relation.relationType,
                relationLabel: RELATION_LABELS[relation.relationType],
                delay: relation.delay,
                issue: relation.issueTo,
                direction: 'from',
            },
            201
        );
    } catch (error) {
        return handleApiError(error);
    }
}
