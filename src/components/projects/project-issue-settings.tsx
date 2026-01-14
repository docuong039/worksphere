'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Info, AlertCircle, Settings } from 'lucide-react';

interface ProjectIssueSettingsProps {
    projectId: string;
    initialSettings: {
        parentIssueDates: string;
        parentIssuePriority: string;
        parentIssueDoneRatio: string;
        parentIssueEstimatedHours: string;
    };
    canManage: boolean;
}

export function ProjectIssueSettings({
    projectId,
    initialSettings,
    canManage,
}: ProjectIssueSettingsProps) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        if (!canManage) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/issue-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast.success('Đã lưu cấu hình');
                setSaved(true);
                router.refresh();
                setTimeout(() => setSaved(false), 2000);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra khi lưu cấu hình');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const configItems = [
        {
            id: 'parentIssueDates',
            label: 'Ngày bắt đầu và Hạn hoàn thành',
            desc: 'Cách tính ngày của công việc cha dựa trên các công việc con.',
        },
        {
            id: 'parentIssuePriority',
            label: 'Độ ưu tiên',
            desc: 'Công việc cha sẽ lấy độ ưu tiên cao nhất từ các công việc con.',
        },
        {
            id: 'parentIssueEstimatedHours',
            label: 'Thời gian ước tính',
            desc: 'Tổng thời gian ước tính của công việc cha là tổng của các công việc con.',
        },
        {
            id: 'parentIssueDoneRatio',
            label: 'Tỷ lệ hoàn thành (%)',
            desc: 'Tỷ lệ hoàn thành của công việc cha được tính trung bình từ các công việc con.',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Thiết lập công việc cha/con</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Tùy chỉnh cách các thuộc tính của công việc cha được kế thừa hoặc tính toán từ các công việc con trong dự án này.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800">
                        <Info className="w-5 h-5 shrink-0" />
                        <p className="text-sm">
                            Các thiết lập này sẽ ghi đè thiết lập hệ thống cho riêng dự án này.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {configItems.map((item) => (
                            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">{item.label}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                                    <button
                                        disabled={!canManage}
                                        onClick={() => setSettings({ ...settings, [item.id]: 'calculated' })}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${settings[item.id as keyof typeof settings] === 'calculated'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            } disabled:opacity-50`}
                                    >
                                        Tự động
                                    </button>
                                    <button
                                        disabled={!canManage}
                                        onClick={() => setSettings({ ...settings, [item.id]: 'independent' })}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${settings[item.id as keyof typeof settings] === 'independent'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            } disabled:opacity-50`}
                                    >
                                        Độc lập
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg flex gap-3 text-orange-800 italic">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div className="text-xs">
                            <strong>Lưu ý:</strong> Chế độ &quot;Tự động&quot; sẽ vô hiệu hóa việc nhập liệu thủ công tại công việc cha nếu nó có ít nhất một công việc con.
                        </div>
                    </div>
                </div>

                {canManage && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                        {saved && (
                            <span className="text-green-600 text-sm font-medium">
                                ✓ Đã lưu thành công
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
