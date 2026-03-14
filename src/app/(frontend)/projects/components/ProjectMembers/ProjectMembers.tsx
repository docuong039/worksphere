'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, User, Crown, Search } from 'lucide-react';
import { useConfirm } from '@/providers/confirm-provider';
import Image from 'next/image';
import { projectService } from '@/api-client/project.service';

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
    isAdministrator?: boolean;
}

export function ProjectMembers({
    projectId,
    members: initialMembers,
    roles,
    availableUsers,
    canManage,
    creatorId,
    isAdministrator = false,
}: ProjectMembersProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [membersList, setMembersList] = useState<Member[]>(initialMembers);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '');
    const [searchUser, setSearchUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter available users (exclude already added members)
    const filteredUsers = availableUsers.filter(
        (user) =>
            user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
            user.email.toLowerCase().includes(searchUser.toLowerCase())
    );

    // Add member
    const handleAddMember = async () => {
        if (selectedUserIds.length === 0 || !selectedRoleId) return;
        setLoading(true);
        setError('');

        const role = roles.find((r) => r.id === selectedRoleId);
        if (!role) return;

        // Construct optimistic members
        const newMembers: Member[] = selectedUserIds.map((userId) => {
            const user = availableUsers.find((u) => u.id === userId);
            return {
                id: `temp-${userId}`, // Temporary ID
                user: {
                    id: userId,
                    name: user?.name || 'Unknown',
                    email: user?.email || '',
                    avatar: user?.avatar || null,
                    isActive: true,
                },
                role: {
                    id: role.id,
                    name: role.name,
                },
            };
        });

        const previousMembers = membersList;
        setMembersList((prev) => [...prev, ...newMembers]);
        setShowAddModal(false);
        const originalUserIds = [...selectedUserIds];
        setSelectedUserIds([]);
        setSearchUser('');
        toast.success('Đã thêm thành viên thành công');

        try {
            await projectService.addMembers(projectId, {
                userIds: originalUserIds,
                roleId: selectedRoleId,
            });
            router.refresh(); // Background sync to get real IDs
        } catch (err: any) {
            // Rollback
            setMembersList(previousMembers);
            setError(err.message || 'Không thể quản lý thành viên. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
            toast.error(err.message || 'Không thể quản lý thành viên. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
            setShowAddModal(true);
            setSelectedUserIds(originalUserIds);
        } finally {
            setLoading(false);
        }
    };

    // Update member role
    const handleUpdateRole = async (memberId: string, roleId: string) => {
        const newRole = roles.find((r) => r.id === roleId);
        // Optimistic: cập nhật vai trò ngay
        const previousMembers = membersList;
        setMembersList((prev) =>
            prev.map((m) => (m.id === memberId ? { ...m, role: newRole || m.role } : m))
        );
        try {
            await projectService.updateMemberRole(projectId, memberId, { roleId });
            toast.success('Đã cập nhật vai trò');
            router.refresh(); // Background sync
        } catch {
            // Rollback
            setMembersList(previousMembers);
            toast.error('Không thể quản lý thành viên. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
        }
    };

    // Remove member
    const handleRemoveMember = async (member: Member) => {
        if (!isAdministrator && member.user.id === creatorId) {
            toast.error('Không thể xóa người tạo dự án');
            return;
        }

        confirm({
            title: 'Xóa thành viên',
            description: `Bạn có chắc muốn xóa ${member.user.name} khỏi dự án?`,
            confirmText: 'Xóa khỏi dự án',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic: xóa ngay
                const previousMembers = membersList;
                setMembersList((prev) => prev.filter((m) => m.id !== member.id));
                toast.success('Đã xóa thành viên');

                try {
                    await projectService.removeMember(projectId, member.id);
                    router.refresh(); // Background sync
                } catch (err: any) {
                    // Rollback
                    setMembersList(previousMembers);
                    toast.error(err.message || 'Không thể quản lý thành viên. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
                }
            },
        });
    };


    const toggleUser = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <span className="text-sm text-gray-500">{membersList.length} thành viên</span>
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
                    {membersList.map((member) => (
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
                                        disabled={!isAdministrator && member.user.id === creatorId}
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

                                {canManage && (isAdministrator || member.user.id !== creatorId) && (
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

                {membersList.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-500">Chưa có thành viên nào</div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Thêm thành viên</h2>
                            <span className="text-sm text-gray-500">
                                Đã chọn: {selectedUserIds.length}
                            </span>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
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
                                <p className="text-[11px] text-gray-500 mt-1">Vai trò này sẽ được áp dụng cho tất cả thành viên được chọn.</p>
                            </div>

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
                                            <div
                                                key={user.id}
                                                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 ${selectedUserIds.includes(user.id) ? 'bg-blue-50' : ''
                                                    }`}
                                                onClick={() => toggleUser(user.id)}
                                            >
                                                <div
                                                    className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUserIds.includes(user.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                                                >
                                                    {selectedUserIds.includes(user.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
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
                                            </div>
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


                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedUserIds([]);
                                    setSearchUser('');
                                    setError('');
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={loading || selectedUserIds.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang thêm...' : `Thêm ${selectedUserIds.length > 0 ? selectedUserIds.length : ''} thành viên`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
