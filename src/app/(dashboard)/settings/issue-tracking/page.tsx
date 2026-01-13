'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, Info } from 'lucide-react';

interface SystemSettings {
    parent_issue_dates: 'calculated' | 'independent';
    parent_issue_priority: 'calculated' | 'independent';
    parent_issue_done_ratio: 'calculated' | 'independent';
    parent_issue_estimated_hours: 'calculated' | 'independent';
}

export default function IssueTrackingSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/settings/issue-tracking')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSettings(data.data);
                }
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings/issue-tracking', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert('Đã lưu cấu hình thành công!');
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi lưu cấu hình');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center">Đang tải cấu hình...</div>;
    if (!settings) return <div className="p-8 text-center text-red-500">Không thể tải cấu hình</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cấu hình Theo dõi công việc</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3 text-blue-800">
                <Info className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                    Các thiết lập dưới đây quyết định cách các thuộc tính của <strong>Công việc cha</strong> được tính toán dựa trên các <strong>Công việc con</strong> của nó.
                </div>
            </div>

            <div className="space-y-6">
                {[
                    {
                        id: 'parent_issue_dates',
                        label: 'Ngày bắt đầu và Hạn hoàn thành',
                        desc: 'Xác định cách tính ngày của công việc cha.',
                    },
                    {
                        id: 'parent_issue_estimated_hours',
                        label: 'Thời gian ước tính',
                        desc: 'Xác định cách tính tổng thời gian ước tính của công việc cha.',
                    },
                    {
                        id: 'parent_issue_done_ratio',
                        label: 'Tỷ lệ hoàn thành (%)',
                        desc: 'Xác định cách tính phần trăm hoàn thành của công việc cha.',
                    }
                ].map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                                <button
                                    onClick={() => setSettings({ ...settings, [item.id]: 'calculated' } as any)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${settings[item.id as keyof SystemSettings] === 'calculated'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Tính toán tự động
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, [item.id]: 'independent' } as any)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${settings[item.id as keyof SystemSettings] === 'independent'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Độc lập
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 border border-orange-200 bg-orange-50 rounded-lg flex gap-3 text-orange-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                    <strong>Chú ý:</strong> Khi chọn chế độ "Tính toán tự động", các ô nhập liệu tương ứng tại công việc cha sẽ bị vô hiệu hóa khi công việc đó có các công việc con.
                </div>
            </div>
        </div>
    );
}
