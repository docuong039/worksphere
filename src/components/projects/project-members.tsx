'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, User, Crown, Search } from 'lucide-react';
import Image from 'next/image';

interface Member {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        isActive: boolean;
    };
    role: {
        id: string;
        name: string;
    };
}

interface Role {
    id: string;
    name: string;
}

interface AvailableUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
}

interface ProjectMembersProps {
    projectId: string;
    members: Member[];
    roles: Role[];
    availableUsers: AvailableUser[];
    canManage: boolean;
    creatorId: string;
}

export function ProjectMembers({
    projectId,
    members,
    roles,
    availableUsers,
    canManage,
    creatorId,
}: ProjectMembersProps) {
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '');
    const [searchUser, setSearchUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter available users
    const filteredUsers = availableUsers.filter(
        (user) =>
            user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
            user.email.toLowerCase().includes(searchUser.toLowerCase())
    );

    // Add member
    const handleAddMember = async () => {
        if (!selectedUserId || !selectedRoleId) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    roleId: selectedRoleId,
                }),
            });

            if (res.ok) {
                setShowAddModal(false);
                setSelectedUserId('');
                setSearchUser('');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    // Update member role
    const handleUpdateRole = async (memberId: string, roleId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId }),
            });
            if (res.ok) {
                toast.success('Đã cập nhật vai trò');
                router.refresh();
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    // Remove member
    const handleRemoveMember = async (member: Member) => {
        if (member.user.id === creatorId) {
            toast.error('Không thể xóa người tạo dự án');
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa ${member.user.name} khỏi dự án?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/${projectId}/members/${member.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Đã xóa thành viên');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <span className="text-sm text-gray-500">{members.length} thành viên</span>
                    {canManage && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm thành viên
                        </button>
                    )}
                </div>

                {/* Members List */}
                <div className="divide-y divide-gray-100">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                    {member.user.avatar ? (
                                        <Image
                                            src={member.user.avatar}
                                            alt={member.user.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>

                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{member.user.name}</span>
                                        {member.user.id === creatorId && (
                                            <span title="Người tạo">
                                                <Crown className="w-4 h-4 text-yellow-500" />
                                            </span>
                                        )}
                                        {!member.user.isActive && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                Đã khóa
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">{member.user.email}</span>
                                </div>
                            </div>

                            {/* Role & Actions */}
                            <div className="flex items-center gap-4">
                                {canManage ? (
                                    <select
                                        value={member.role.id}
                                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={member.user.id === creatorId}
                                    >
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                                        {member.role.name}
                                    </span>
                                )}

                                {canManage && member.user.id !== creatorId && (
                                    <button
                                        onClick={() => handleRemoveMember(member)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Xóa khỏi dự án"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {members.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-500">Chưa có thành viên nào</div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm thành viên</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Search User */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chọn người dùng
                                </label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchUser}
                                        onChange={(e) => setSearchUser(e.target.value)}
                                        placeholder="Tìm theo tên hoặc email..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <label
                                                key={user.id}
                                                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 ${selectedUserId === user.id ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="userId"
                                                    value={user.id}
                                                    checked={selectedUserId === user.id}
                                                    onChange={() => setSelectedUserId(user.id)}
                                                    className="w-4 h-4"
                                                />
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                    {user.avatar ? (
                                                        <Image
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            width={32}
                                                            height={32}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-600">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="px-4 py-3 text-sm text-gray-500 text-center">
                                            {availableUsers.length === 0
                                                ? 'Tất cả người dùng đã là thành viên'
                                                : 'Không tìm thấy'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Select Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                <select
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedUserId('');
                                    setSearchUser('');
                                    setError('');
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={loading || !selectedUserId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang thêm...' : 'Thêm thành viên'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
