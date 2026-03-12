'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    MessageSquare,
    Pencil,
    X,
    Send,
    MoreVertical,
    Trash2,
    Check,
} from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import { taskService } from '@/api-client/task.service';

interface Comment {
    id: string;
    content: string;
    createdAt: string | Date;
    user: { id: string; name: string; avatar: string | null };
}

interface TaskCommentsProps {
    taskId: string;
    comments: Comment[];
    currentUserId: string;
}

export function TaskComments({ taskId, comments: initialComments, currentUserId }: TaskCommentsProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [commentsList, setCommentsList] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    // Edit/Delete states
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
    const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);

    // Sync comments with props when server data changes (e.g. after refresh)
    useEffect(() => {
        setCommentsList(initialComments);
    }, [initialComments]);



    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setAddingComment(true);

        // Optimistic: hiện comment ngay với temp ID
        const tempId = `temp-${Date.now()}`;
        const optimisticComment: Comment = {
            id: tempId,
            content: newComment,
            createdAt: new Date(),
            user: { id: currentUserId, name: 'Bạn', avatar: null },
        };
        setCommentsList((prev) => [...prev, optimisticComment]);
        const commentText = newComment;
        setNewComment('');

        try {
            await taskService.addComment(taskId, commentText);
            // Background sync để lấy real comment data (có id thật từ server)
            router.refresh();
            // Xóa temp comment sau khi router.refresh cập nhật data mới
            // (router.refresh sẵ re-render component với data mới từ server)
        } catch (err) {
            // Rollback: xóa temp comment
            setCommentsList((prev) => prev.filter((c) => c.id !== tempId));
            setNewComment(commentText);
            console.error(err);
            toast.error('Không thể gửi bình luận');
        }
        setAddingComment(false);
    };

    const handleEditComment = (commentId: string, content: string) => {
        setEditingCommentId(commentId);
        setEditingCommentContent(content);
        setOpenMenuCommentId(null);
    };

    const handleSaveEditComment = async () => {
        if (!editingCommentId || !editingCommentContent.trim()) return;
        setSavingComment(true);

        // Optimistic: cập nhật nội dung ngay
        const previousComments = commentsList;
        setCommentsList((prev) =>
            prev.map((c) =>
                c.id === editingCommentId ? { ...c, content: editingCommentContent } : c
            )
        );
        const editId = editingCommentId;
        setEditingCommentId(null);
        setEditingCommentContent('');

        try {
            await taskService.updateComment(taskId, editId, editingCommentContent);
            toast.success('Đã cập nhật bình luận');
            router.refresh(); // Background sync
        } catch (err: any) {
            // Rollback
            setCommentsList(previousComments);
            toast.error(err.message || 'Có lỗi xảy ra');
        }
        setSavingComment(false);
    };

    const handleCancelEditComment = () => {
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    const handleDeleteComment = async (commentId: string) => {
        confirm({
            title: 'Xóa bình luận',
            description: 'Bạn có chắc muốn xóa bình luận này? Thao tác này không thể hoàn tác.',
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                setDeletingCommentId(commentId);
                setOpenMenuCommentId(null);

                // Optimistic: xóa ngay
                const previousComments = commentsList;
                setCommentsList((prev) => prev.filter((c) => c.id !== commentId));

                try {
                    await taskService.deleteComment(taskId, commentId);
                    toast.success('Đã xóa bình luận');
                    router.refresh(); // Background sync
                } catch (err: any) {
                    // Rollback
                    setCommentsList(previousComments);
                    toast.error(err.message || 'Có lỗi xảy ra');
                }
                setDeletingCommentId(null);
            }
        });
    };


    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-gray-800 text-sm">Bình luận</h4>
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">{commentsList.length}</span>
                </div>
            </div>

            <div className="p-6">
                {/* Comments List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-5 pr-2">
                    {commentsList.map((c: Comment) => (
                        <div key={c.id} className={`flex gap-3 ${c.user.id === currentUserId ? 'flex-row-reverse' : ''}`}>
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs shrink-0 overflow-hidden font-bold text-white shadow-sm">
                                {c.user.avatar ? (
                                    <Image src={c.user.avatar} alt={c.user.name} width={36} height={36} className="w-full h-full object-cover" />
                                ) : (
                                    c.user.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className={`flex flex-col max-w-[75%] ${c.user.id === currentUserId ? 'items-end' : ''}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className="text-font-semibold text-xs text-gray-700">{c.user.name}</span>
                                    <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                                    {/* Menu dropdown for comment owner */}
                                    {c.user.id === currentUserId && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuCommentId(openMenuCommentId === c.id ? null : c.id)}
                                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                                title="Tùy chọn"
                                            >
                                                <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                            {openMenuCommentId === c.id && (
                                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                                                    <button
                                                        onClick={() => handleEditComment(c.id, c.content)}
                                                        className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(c.id)}
                                                        className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Edit mode or display mode */}
                                {editingCommentId === c.id ? (
                                    <div className="w-full space-y-2">
                                        <textarea
                                            value={editingCommentContent}
                                            onChange={(e) => setEditingCommentContent(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none resize-none"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={handleCancelEditComment}
                                                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                disabled={savingComment}
                                            >
                                                <X className="w-3.5 h-3.5 inline mr-1" />
                                                Hủy
                                            </button>
                                            <button
                                                onClick={handleSaveEditComment}
                                                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                                disabled={savingComment || !editingCommentContent.trim()}
                                            >
                                                <Check className="w-3.5 h-3.5 inline mr-1" />
                                                {savingComment ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${c.user.id === currentUserId ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'} ${deletingCommentId === c.id ? 'opacity-50' : ''}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {commentsList.length === 0 && (
                        <div className="text-center py-10">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 font-medium">Chưa có bình luận nào</p>
                            <p className="text-xs text-gray-500 mt-1">Hãy là người đầu tiên bình luận</p>
                        </div>
                    )}
                </div>

                {/* Comment Input */}
                <div className="flex gap-3 items-end pt-4 border-t border-gray-100">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Nhập bình luận của bạn..."
                        rows={2}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none resize-none transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={addingComment || !newComment.trim()}
                        className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
