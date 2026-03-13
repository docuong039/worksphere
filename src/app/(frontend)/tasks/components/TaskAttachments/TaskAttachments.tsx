'use client';

import { useState, useEffect } from 'react';
import { Paperclip, Upload, File as FileIcon, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/providers/confirm-provider';

import { AttachmentWithUser } from '@/types';

interface TaskAttachmentsProps {
    taskId: string;
    initialAttachments: AttachmentWithUser[];
    canUpload: boolean;
    currentUserId: string;
}

export function TaskAttachments({
    taskId,
    initialAttachments,
    canUpload,
    currentUserId,
}: TaskAttachmentsProps) {
    const { confirm } = useConfirm();
    const [attachments, setAttachments] = useState(initialAttachments);
    const [uploading, setUploading] = useState(false);

    // Sync state with props
    useEffect(() => {
        setAttachments(initialAttachments);
    }, [initialAttachments]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/tasks/${taskId}/attachments`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setAttachments((prev) => [...prev, data.data]);
                toast.success('Đã tải lên tài liệu');
                // router.refresh() không cần - state đã được cập nhật
            } else {
                toast.error('Không thể tải lên tài liệu');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (attachmentId: string) => {
        confirm({
            title: 'Xóa tài liệu',
            description: 'Bạn có chắc muốn xóa tài liệu này? Thao tác này không thể hoàn tác.',
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay
                const previous = attachments;
                setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
                toast.success('Đã xóa tài liệu');

                try {
                    const res = await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
                    if (!res.ok) {
                        setAttachments(previous); // Rollback
                        toast.error('Không thể xóa tài liệu');
                    }
                } catch {
                    setAttachments(previous); // Rollback
                    toast.error('Lỗi kết nối máy chủ');
                }
            }
        });
    };


    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    Tài liệu ({attachments.length})
                </h4>
                {canUpload && (
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? 'Đang tải...' : 'Tải lên'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
                {attachments.map((att) => (
                    <div
                        key={att.id}
                        className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-gray-100 group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-blue-100/50 rounded-lg flex items-center justify-center shrink-0">
                                <FileIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <a
                                    href={att.path}
                                    download={att.filename}
                                    className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate block"
                                >
                                    {att.filename}
                                </a>
                                <p className="text-[10px] text-gray-500 font-medium flex gap-2">
                                    <span>{formatSize(att.size)}</span>
                                    <span>•</span>
                                    <span>{att.user.name}</span>
                                    <span>•</span>
                                    <span>{new Date(att.createdAt).toLocaleDateString('vi-VN')}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                                href={att.path}
                                download
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Tải xuống"
                            >
                                <Download className="w-4 h-4" />
                            </a>
                            {(currentUserId === att.user.id || currentUserId === 'admin') && (
                                <button
                                    onClick={() => handleDelete(att.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {attachments.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-[13px] italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        Chưa có tài liệu đính kèm
                    </div>
                )}
            </div>
        </div>
    );
}
