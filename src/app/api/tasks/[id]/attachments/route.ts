import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-error';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { withAuth } from '@/server/middleware/withAuth';
import type { RouteContext } from '@/server/middleware/withAuth';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/modules/task/task.policy';


// POST /api/tasks/[id]/attachments - Upload attachment
export const POST = withAuth(async (req, user, ctx) => {
    const { id } = await (ctx as RouteContext<{ id: string }>).params;
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return errorResponse('Không tìm thấy file', 400);
    }

    // Check permissions
    const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, projectId: true, creatorId: true, assigneeId: true, isPrivate: true },
    });
    if (!task) return errorResponse('Task không tồn tại', 404);

    // Authorization Policy check
    const userPermissions = await getUserPermissions(user.id, task.projectId);
    const canUpdate = TaskPolicy.canUpdateTask(user, task, userPermissions);

    if (!canUpdate) return errorResponse('Không có quyền đính kèm tệp vào công việc này', 403);


    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch {
        // ignore if exists
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Create attachment record
    const attachment = await prisma.attachment.create({
        data: {
            filename: file.name,
            path: `/uploads/${filename}`,
            size: file.size,
            mimeType: file.type,
            taskId: id,
            userId: user.id,
        },
        include: {
            user: { select: { id: true, name: true } },
        },
    });

    return successResponse(attachment, 201);
});
