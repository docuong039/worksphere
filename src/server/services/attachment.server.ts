import prisma from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/server/policies/task.policy';
import * as AttachmentPolicy from '@/server/policies/attachment.policy';

import { SessionUser } from '@/types';

export class AttachmentServerService {
    static async createAttachment(user: SessionUser, taskId: string, formData: FormData) {
        const file = formData.get('file') as File;

        if (!file) {
            throw new Error('Không tìm thấy file');
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, projectId: true, creatorId: true, assigneeId: true, isPrivate: true },
        });

        if (!task) throw new Error('Task không tồn tại');

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canUpdate = TaskPolicy.canUpdateTask(user, task, userPermissions);

        if (!canUpdate) {
            throw new Error('Không có quyền đính kèm tệp vào công việc này');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public/uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // ignore
        }

        const originalName = file.name || 'document';
        const ext = path.extname(originalName);
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        const attachment = await prisma.attachment.create({
            data: {
                filename: originalName,
                path: `/uploads/${filename}`,
                size: file.size,
                mimeType: file.type || 'application/octet-stream',
                taskId,
                userId: user.id,
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });

        return attachment;
    }

    static async deleteAttachment(user: SessionUser, id: string) {
        const attachment = await prisma.attachment.findUnique({
            where: { id },
            include: { task: { select: { projectId: true } } },
        });

        if (!attachment) throw new Error('File không tồn tại');

        const projectId = attachment.task?.projectId;
        const userPermissions = projectId ? await getUserPermissions(user.id, projectId) : [];
        const canDelete = AttachmentPolicy.canDeleteAttachment(user, attachment, userPermissions);

        if (!canDelete) {
            throw new Error('Không có quyền xóa tệp đính kèm này');
        }

        await prisma.attachment.delete({ where: { id } });

        const filepath = path.join(process.cwd(), 'public', attachment.path);
        try {
            await unlink(filepath);
        } catch (e) {
            console.error('Failed to delete file from disk:', e);
        }

        return true;
    }
}
