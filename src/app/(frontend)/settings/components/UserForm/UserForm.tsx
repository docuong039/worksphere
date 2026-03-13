'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/UI/Switch';
import { UserType } from '@/app/(frontend)/settings/components/UserList';

export interface UserFormData {
    name: string;
    email: string;
    password?: string;
    isAdministrator: boolean;
}

interface UserFormProps {
    initialData?: UserType | null;
    onSubmit: (data: UserFormData) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

export function UserForm({ initialData, onSubmit, onCancel, isLoading }: UserFormProps) {
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        isAdministrator: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const isEditing = !!initialData;

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email,
                isAdministrator: initialData.isAdministrator,
                password: '', // Don't show password on edit
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Cập nhật thông tin người dùng' : 'Thêm người dùng mới'}
            </h3>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Họ và tên"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="email@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isEditing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required={!isEditing}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-10 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={isEditing ? '••••••••' : 'Nhập mật khẩu...'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={formData.isAdministrator}
                            onChange={(checked) => setFormData({ ...formData, isAdministrator: checked })}
                        />
                        <span className="text-sm font-medium text-gray-700">Administrator</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-700 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditing ? 'Lưu thay đổi' : 'Tạo người dùng'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
