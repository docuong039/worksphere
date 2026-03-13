import prisma from '@/lib/prisma';
import { createCommentSchema, updateCommentSchema } from '@/lib/validations';
import { notifyCommentAdded } from '@/lib/notifications';
import { getUserPermissions } from '@/lib/permissions';
import * as TaskPolicy from '@/server/policies/task.policy';
import * as CommentPolicy from '@/server/policies/comment.policy';

import { SessionUser } from '@/types';

export class CommentServerService {
    static async getComments(taskId: string) {
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return comments;
    }

    static async createComment(user: SessionUser, taskId: string, data: any) {
        const validatedData = createCommentSchema.parse({ ...data, taskId });

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, projectId: true, title: true, creatorId: true, assigneeId: true, isPrivate: true },
        });

        if (!task) throw new Error('Công việc không tồn tại');

        const userPermissions = await getUserPermissions(user.id, task.projectId);

        if (!TaskPolicy.canViewTask(user, task, userPermissions)) {
            throw new Error('Không có quyền truy cập công việc này');
        }

        if (!CommentPolicy.canCreateComment(user, userPermissions)) {
            throw new Error('Bạn không có quyền bình luận trong dự án này');
        }

        const comment = await prisma.comment.create({
            data: {
                content: validatedData.content,
                taskId,
                userId: user.id,
            },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        await prisma.task.update({
            where: { id: taskId },
            data: { updatedAt: new Date() },
        });

        notifyCommentAdded(
            taskId,
            task.title,
            user.id,
            user.name || 'Ai đó',
            validatedData.content,
            comment.id
        );

        return comment;
    }

    static async updateComment(user: SessionUser, taskId: string, commentId: string, data: any) {
        const validatedData = updateCommentSchema.parse(data);

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, userId: true, taskId: true },
        });

        if (!comment) throw new Error('Bình luận không tồn tại');

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { projectId: true }
        });

        if (!task || comment.taskId !== taskId) {
            throw new Error('Bình luận không thuộc công việc này');
        }

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canEdit = CommentPolicy.canUpdateComment(user, comment, userPermissions);

        if (!canEdit) throw new Error('Không có quyền chỉnh sửa bình luận này');

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content: validatedData.content,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        return updatedComment;
    }

    static async deleteComment(user: SessionUser, taskId: string, commentId: string) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, userId: true, taskId: true },
        });

        if (!comment) throw new Error('Bình luận không tồn tại');

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { projectId: true }
        });

        if (!task || comment.taskId !== taskId) {
            throw new Error('Bình luận không thuộc công việc này');
        }

        const userPermissions = await getUserPermissions(user.id, task.projectId);
        const canDelete = CommentPolicy.canDeleteComment(user, comment, userPermissions);

        if (!canDelete) throw new Error('Không có quyền xóa bình luận này');

        await prisma.comment.delete({
            where: { id: commentId },
        });

        return true;
    }
}
