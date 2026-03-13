'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Shield, User } from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import { Switch } from '@/components/UI/Switch';
import { userService } from '@/api-client/user.service';
import { UserForm, UserFormData } from '@/app/(frontend)/settings/components/UserForm';
import type { DateLike } from '@/lib/date-utils';
import { ApiClientError } from '@/lib/api-fetch';
import { Pagination } from '@/components/UI/Pagination';
import type { PaginationResult } from '@/lib/pagination';

export interface UserType {
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
    initialData: {
        users: UserType[];
        pagination: PaginationResult;
    };
}

export function UserList({ initialData }: UserListProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [users, setUsers] = useState(initialData.users);
    const [pagination, setPagination] = useState(initialData.pagination);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');

    // Create user
    const handleCreate = async (data: UserFormData) => {
        setLoading(true);
        setError('');

        try {
            const response = await userService.create({
                ...data,
                password: data.password || ''
            });

            setIsAdding(false);
            toast.success('Đã tạo người dùng mới');

            // Optimistic: thêm user mới vào state ngay từ response
            if (response.data) {
                setUsers((prev) => [...prev, {
                    ...response.data!,
                    _count: { projectMemberships: 0, assignedTasks: 0 },
                } as UserType]);
            }
            router.refresh(); // Background sync để lấy full data (avatar, roles...)
        } catch (err) {
            if (err instanceof ApiClientError && err.message) {
                setError(err.message);
            } else {
                setError('Có lỗi xảy ra khi tạo người dùng');
            }
        } finally {
            setLoading(false);
        }
    };

    // Update user
    const handleUpdate = async (id: string, data: UserFormData) => {
        setLoading(true);
        setError('');

        // Optimistic: cập nhật ngay
        const previousUsers = users;
        setUsers((prev) =>
            prev.map((u) =>
                u.id === id
                    ? { ...u, name: data.name, email: data.email, isAdministrator: data.isAdministrator ?? u.isAdministrator }
                    : u
            )
        );
        setEditingId(null);

        try {
            const updateData: Record<string, unknown> = {
                name: data.name,
                email: data.email,
                isAdministrator: data.isAdministrator,
            };
            if (data.password) {
                updateData.password = data.password;
            }
            await userService.update(id, updateData);
            toast.success('Cập nhật thành công');
            router.refresh(); // Background sync
        } catch (err) {
            // Rollback
            setUsers(previousUsers);
            const msg = err instanceof Error ? err.message : 'Có lỗi cập nhật';
            setError(msg);
            toast.error(msg);
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

        confirm({
            title: 'Xóa người dùng',
            description: `Bạn có chắc muốn xóa người dùng "${user.name}"? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa ngay',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay
                const previousUsers = users;
                setUsers((prev) => prev.filter((u) => u.id !== user.id));
                toast.success('Đã xóa người dùng');

                try {
                    await userService.delete(user.id);
                    router.refresh(); // Background sync
                } catch (err) {
                    // Rollback
                    setUsers(previousUsers);
                    const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    toast.error(msg);
                }
            },
        });
    };


    // Toggle active
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        const newActiveStatus = !currentActive;
        // Optimistic update
        setUsers(prev => prev.map(user =>
            user.id === id ? { ...user, isActive: newActiveStatus } : user
        ));

        try {
            await userService.update(id, { isActive: newActiveStatus });
            toast.success(`Đã ${newActiveStatus ? 'kích hoạt' : 'khóa'} người dùng`);
        } catch (err) {
            // Revert on error
            setUsers(prev => prev.map(user =>
                user.id === id ? { ...user, isActive: currentActive } : user
            ));
            const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
            toast.error(msg);
        }
    };

    // Start editing
    const startEdit = (user: UserType) => {
        setEditingId(user.id);
        setIsAdding(false);
        setError('');
        // Form data is now handled by UserForm effect
    };

    // Handle page change
    const onPageChange = (newPage: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage.toString());
        router.push(`?${params.toString()}`);
    };
    
    // Đồng bộ state khi initialData thay đổi từ server props
    useEffect(() => {
        setUsers(initialData.users);
        setPagination(initialData.pagination);
    }, [initialData]);

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{pagination.total} người dùng</span>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
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
            {/* Add/Edit Form Section */}
            {(isAdding || editingId) && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <UserForm
                        initialData={editingId ? users.find(u => u.id === editingId) : null}
                        isLoading={loading}
                        onCancel={() => {
                            setIsAdding(false);
                            setEditingId(null);
                        }}
                        onSubmit={async (data) => {
                            if (editingId) {
                                await handleUpdate(editingId, data);
                            } else {
                                await handleCreate(data);
                            }
                        }}
                    />
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
                        <tr key={user.id} className={`border-b border-gray-200 hover:bg-gray-50 ${editingId === user.id ? 'bg-blue-50' : ''}`}>
                            {/* Normal Render Only - Edit is now in Top Form */}
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
                        </tr>
                    ))}
                </tbody>
            </table>

            {users.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                    Chưa có người dùng nào.
                </div>
            )}

            <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
            />
        </div>
    );
}
