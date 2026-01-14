'use client';

import { useState } from 'react';
import { Paperclip, Upload, File as FileIcon, Download, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Attachment {
    id: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    createdAt: string | Date;
    user: { id: string; name: string };
}

interface TaskAttachmentsProps {
    taskId: string;
    initialAttachments: Attachment[];
    canUpload: boolean;
    currentUserId: string;
}

export function TaskAttachments({
    taskId,
    initialAttachments,
    canUpload,
    currentUserId,
}: TaskAttachmentsProps) {
    const router = useRouter();
    const [attachments, setAttachments] = useState(initialAttachments);
    const [uploading, setUploading] = useState(false);

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
                setAttachments([...attachments, data.data]);
                toast.success('Đã tải lên tài liệu');
                router.refresh();
            } else {
                toast.error('Không thể tải lên tài liệu');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (!confirm('Xóa file này?')) return;
        try {
            const res = await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
            if (res.ok) {
                setAttachments(attachments.filter((a) => a.id !== attachmentId));
                toast.success('Đã xóa tài liệu');
                router.refresh();
            } else {
                toast.error('Không thể xóa tài liệu');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Tài liệu đính kèm ({attachments.length})
                </h3>
                {canUpload && (
                    <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Đang tải...' : 'Thêm tài liệu'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((att) => (
                    <div
                        key={att.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center shrink-0">
                                <FileIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <a
                                    href={att.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                                >
                                    {att.filename}
                                </a>
                                <p className="text-xs text-gray-500">
                                    {formatSize(att.size)} • {att.user.name} •{' '}
                                    {new Date(att.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                                href={att.path}
                                download
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Tải xuống"
                            >
                                <Download className="w-4 h-4" />
                            </a>
                            {(currentUserId === att.user.id || currentUserId === 'admin') && ( // simplified admin check
                                <button
                                    onClick={() => handleDelete(att.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Xóa file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {attachments.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
                        Chưa có tài liệu đính kèm
                    </div>
                )}
            </div>
        </div>
    );
}
