'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Shield, User, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { DateLike } from '@/lib/types';

interface UserType {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    isAdministrator: boolean;
    isActive: boolean;
    createdAt: DateLike;
    _count: {
        projectMemberships: number;
        assignedTasks: number;
    };
}

interface UserListProps {
    users: UserType[];
}

export function UserList({ users: initialUsers }: UserListProps) {
    const router = useRouter();
    const [users, setUsers] = useState(initialUsers);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        isAdministrator: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Create user
    const handleCreate = async () => {
        if (!formData.name.trim() || !formData.email.trim() || !formData.password) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({ name: '', email: '', password: '', isAdministrator: false });
                router.refresh();
            } else {
                const data = await res.json();
                if (data.errors && Array.isArray(data.errors)) {
                    interface FieldError { field?: string; message: string }
                    const errorMsg = data.errors.map((e: FieldError) => `${e.field || 'Lỗi'}: ${e.message}`).join(', ');
                    setError(errorMsg);
                } else {
                    setError(data.error || 'Có lỗi xảy ra');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Update user
    const handleUpdate = async (id: string) => {
        setLoading(true);
        setError('');

        try {
            const updateData: Record<string, unknown> = {
                name: formData.name,
                email: formData.email,
                isAdministrator: formData.isAdministrator,
            };

            // Chỉ gửi password nếu có thay đổi
            if (formData.password) {
                updateData.password = formData.password;
            }

            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (res.ok) {
                setEditingId(null);
                setFormData({ name: '', email: '', password: '', isAdministrator: false });
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    // Delete user
    const handleDelete = async (user: UserType) => {
        if (user._count.assignedTasks > 0) {
            toast.error(`Không thể xóa user đang được gán ${user._count.assignedTasks} công việc`);
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa user "${user.name}"?`)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Đã xóa người dùng');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    // Toggle active
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        const newActiveStatus = !currentActive;
        // Optimistic update
        setUsers(prev => prev.map(user =>
            user.id === id ? { ...user, isActive: newActiveStatus } : user
        ));

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newActiveStatus }),
            });

            if (!res.ok) {
                // Revert on error
                setUsers(prev => prev.map(user =>
                    user.id === id ? { ...user, isActive: currentActive } : user
                ));
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            // Revert on error
            setUsers(prev => prev.map(user =>
                user.id === id ? { ...user, isActive: currentActive } : user
            ));
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    // Start editing
    const startEdit = (user: UserType) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            isAdministrator: user.isAdministrator,
        });
        setError('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{users.length} người dùng</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', email: '', password: '', isAdministrator: false });
                        setError('');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm người dùng
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Add Form */}
            {isAdding && (
                <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Họ và tên"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="email@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.isAdministrator}
                                    onChange={(checked) => setFormData({ ...formData, isAdministrator: checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Administrator</span>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={loading || !formData.name || !formData.email || !formData.password}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                Tạo
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Người dùng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Vai trò
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Dự án
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Công việc
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Trạng thái
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Thao tác
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                            {editingId === user.id ? (
                                <>
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Switch
                                                checked={formData.isAdministrator}
                                                onChange={(checked) =>
                                                    setFormData({ ...formData, isAdministrator: checked })
                                                }
                                            />
                                            <span className="text-sm font-medium text-gray-700">Admin</span>
                                        </div>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td className="px-6 py-3 text-right">
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm mr-2"
                                            placeholder="Mật khẩu mới"
                                        />
                                        <button
                                            onClick={() => handleUpdate(user.id)}
                                            disabled={loading}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 mr-2"
                                        >
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                        >
                                            Hủy
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                {user.avatar ? (
                                                    <Image
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        width={32}
                                                        height={32}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : (
                                                    <User className="w-4 h-4 text-gray-500" />
                                                )}
                                            </div>
                                            <span className={`font-medium ${user.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {user.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-3 text-center">
                                        {user.isAdministrator ? (
                                            <span className="inline-flex items-center gap-1 text-red-600">
                                                <Shield className="w-4 h-4" />
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-500">
                                        {user._count.projectMemberships}
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-500">
                                        {user._count.assignedTasks}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {user.isActive ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                Đã khóa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Switch
                                                checked={user.isActive}
                                                onChange={() => handleToggleActive(user.id, user.isActive)}
                                            />
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="p-1 text-gray-400 hover:text-blue-600"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {users.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                    Chưa có người dùng nào.
                </div>
            )}
        </div>
    );
}
