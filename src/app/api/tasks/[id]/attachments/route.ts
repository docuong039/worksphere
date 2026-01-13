import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-error';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/tasks/[id]/attachments - Upload attachment
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await auth();
        if (!session) return errorResponse('Chưa đăng nhập', 401);

        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return errorResponse('Không tìm thấy file', 400);
        }

        // Check permissions
        const task = await prisma.task.findUnique({
            where: { id },
            select: { projectId: true },
        });
        if (!task) return errorResponse('Task không tồn tại', 404);

        const canUpload =
            session.user.isAdministrator ||
            (await prisma.projectMember.findFirst({
                where: { userId: session.user.id, projectId: task.projectId },
            }));

        if (!canUpload) return errorResponse('Không có quyền upload file', 403);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
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
                userId: session.user.id,
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });

        return successResponse(attachment, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
