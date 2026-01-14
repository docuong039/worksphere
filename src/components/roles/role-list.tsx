'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Shield, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { RoleTrackerPermissions } from './role-tracker-permissions';

interface Tracker {
    id: string;
    name: string;
    position: number;
}

interface Permission {
    id: string;
    key: string;
    name: string;
    module: string;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    assignable: boolean;
    canAssignToOther: boolean;
    permissions: Array<{
        permission: Permission;
    }>;
    trackers: Array<{
        trackerId: string;
    }>;
    _count: {
        projectMembers: number;
    };
}

interface RoleListProps {
    roles: Role[];
    groupedPermissions: Record<string, Permission[]>;
    allTrackers: Tracker[];
}

export function RoleList({ roles: initialRoles, groupedPermissions, allTrackers }: RoleListProps) {
    const router = useRouter();
    const [roles, setRoles] = useState(initialRoles);

    // Sync roles when initialRoles changes (e.g. after add/delete/update)
    useEffect(() => {
        setRoles(initialRoles);
    }, [initialRoles]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'trackers'>('general');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        assignable: true,
        canAssignToOther: true,
    });
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

    // Module names in Vietnamese
    const moduleNames: Record<string, string> = {
        users: 'Người dùng',
        projects: 'Dự án',
        tasks: 'Công việc',
        time: 'Thời gian',
        reports: 'Báo cáo',
        system: 'Hệ thống',
    };

    // Create role
    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                // Update permissions if any selected
                if (selectedPermissions.size > 0) {
                    await fetch(`/api/roles/${data.data.id}/permissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ permissionIds: Array.from(selectedPermissions) }),
                    });
                }
                setIsAdding(false);
                setFormData({ name: '', description: '', assignable: true, canAssignToOther: true });
                setSelectedPermissions(new Set());
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Có lỗi xảy ra');
            }
        } finally {
            setLoading(false);
        }
    };

    // Update role
    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) return;
        setLoading(true);
        setError('');

        try {
            // Update role info
            await fetch(`/api/roles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            // Update permissions
            await fetch(`/api/roles/${id}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissionIds: Array.from(selectedPermissions) }),
            });

            setEditingId(null);
            setFormData({ name: '', description: '', assignable: true, canAssignToOther: true });
            setSelectedPermissions(new Set());
            router.refresh();
        } catch {
            setError('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    // Delete role
    const handleDelete = async (id: string, name: string, memberCount: number) => {
        if (memberCount > 0) {
            toast.error(`Không thể xóa role "${name}" đang được sử dụng bởi ${memberCount} thành viên`);
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa role "${name}"?`)) return;

        try {
            const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Đã xóa vai trò');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    // Clone role
    const handleClone = async (role: Role) => {
        setLoading(true);
        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${role.name} (Copy)`,
                    description: role.description,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const permIds = role.permissions.map((p) => p.permission.id);
                if (permIds.length > 0) {
                    await fetch(`/api/roles/${data.data.id}/permissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ permissionIds: permIds }),
                    });
                }
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    };

    // Toggle active
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        const newActiveStatus = !currentActive;
        // Optimistic update
        setRoles(prev => prev.map(role =>
            role.id === id ? { ...role, isActive: newActiveStatus } : role
        ));

        try {
            const res = await fetch(`/api/roles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newActiveStatus }),
            });

            if (!res.ok) {
                // Revert on error
                setRoles(prev => prev.map(role =>
                    role.id === id ? { ...role, isActive: currentActive } : role
                ));
                const data = await res.json();
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            // Revert on error
            setRoles(prev => prev.map(role =>
                role.id === id ? { ...role, isActive: currentActive } : role
            ));
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    // Start editing
    const startEdit = (role: Role) => {
        setEditingId(role.id);
        setExpandedId(role.id);
        setActiveTab('general');
        setFormData({
            name: role.name,
            description: role.description || '',
            assignable: role.assignable !== false,
            canAssignToOther: role.canAssignToOther !== false
        });
        setSelectedPermissions(new Set(role.permissions.map((p) => p.permission.id)));
    };

    // Toggle permission
    const togglePermission = (permId: string) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(permId)) {
            newSet.delete(permId);
        } else {
            newSet.add(permId);
        }
        setSelectedPermissions(newSet);
    };

    // Toggle all permissions in module
    const toggleModule = (module: string) => {
        const modulePerms = groupedPermissions[module] || [];
        const modulePermIds = modulePerms.map((p) => p.id);
        const allSelected = modulePermIds.every((id) => selectedPermissions.has(id));

        const newSet = new Set(selectedPermissions);
        if (allSelected) {
            modulePermIds.forEach((id) => newSet.delete(id));
        } else {
            modulePermIds.forEach((id) => newSet.add(id));
        }
        setSelectedPermissions(newSet);
    };

    return (
        <div className="space-y-4">
            {/* Add Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', description: '', assignable: true, canAssignToOther: true });
                        setSelectedPermissions(new Set());
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Thêm vai trò
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                    {error}
                </div>
            )}

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm vai trò mới</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên vai trò</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="VD: Senior Developer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Mô tả vai trò..."
                            />
                        </div>
                    </div>

                    {/* Removed Assignable Checkbox as per user request to simplify. Defaulted to true in logic. */}

                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.canAssignToOther}
                                onChange={(checked) => setFormData({ ...formData, canAssignToOther: checked })}
                            />
                            <span className="text-sm text-gray-700">
                                Có thể gán công việc cho thành viên khác (Can assign to others)
                            </span>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                        <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div key={module} className="border-b border-gray-100 last:border-0">
                                    <div
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleModule(module)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={perms.every((p) => selectedPermissions.has(p.id))}
                                            onChange={() => toggleModule(module)}
                                            className="w-4 h-4 rounded"
                                        />
                                        <span className="font-medium text-sm text-gray-700">
                                            {moduleNames[module] || module}
                                        </span>
                                        <span className="text-xs text-gray-400">({perms.length})</span>
                                    </div>
                                    <div className="px-6 py-2 grid grid-cols-2 gap-2">
                                        {perms.map((perm) => (
                                            <label key={perm.id} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.has(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <span className="text-gray-600">{perm.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading || !formData.name.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Tạo vai trò'}
                        </button>
                    </div>
                </div>
            )}

            {/* Role Cards */}
            {roles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg border border-gray-200">
                    {/* Role Header */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setExpandedId(expandedId === role.id ? null : role.id)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                {expandedId === role.id ? (
                                    <ChevronDown className="w-5 h-5" />
                                ) : (
                                    <ChevronRight className="w-5 h-5" />
                                )}
                            </button>

                            <Shield className={`w-5 h-5 ${role.isActive ? 'text-blue-600' : 'text-gray-400'}`} />

                            <div>
                                <h3 className={`font-medium ${role.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {role.name}
                                </h3>
                                {role.description && (
                                    <p className="text-sm text-gray-500">{role.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                {role.permissions.length} quyền · {role._count.projectMembers} thành viên
                            </span>

                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={role.isActive}
                                    onChange={() => handleToggleActive(role.id, role.isActive)}
                                />
                                <button
                                    onClick={() => handleClone(role)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                                    title="Nhân bản"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => startEdit(role)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                                    title="Sửa"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(role.id, role.name, role._count.projectMembers)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                                    title="Xóa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Permissions / Edit Form */}
                    {(expandedId === role.id || editingId === role.id) && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            {editingId === role.id ? (
                                <div className="space-y-4">
                                    <div className="flex border-b border-gray-200">
                                        <button
                                            onClick={() => setActiveTab('general')}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Thông tin chung
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('trackers')}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trackers'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Trackers
                                        </button>
                                    </div>

                                    {activeTab === 'trackers' ? (
                                        <div className="py-2">
                                            <RoleTrackerPermissions
                                                roleId={role.id}
                                                roleName={role.name}
                                                allTrackers={allTrackers}
                                                assignedTrackerIds={role.trackers.map(t => t.trackerId)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Tên vai trò
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                                    <input
                                                        type="text"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={formData.canAssignToOther}
                                                        onChange={(checked) => setFormData({ ...formData, canAssignToOther: checked })}
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        Có thể gán công việc cho thành viên khác (Can assign to others)
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                                                <div className="border border-gray-200 rounded-md bg-white max-h-64 overflow-y-auto">
                                                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                                                        <div key={module} className="border-b border-gray-100 last:border-0">
                                                            <div
                                                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer"
                                                                onClick={() => toggleModule(module)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={perms.every((p) => selectedPermissions.has(p.id))}
                                                                    onChange={() => toggleModule(module)}
                                                                    className="w-4 h-4 rounded"
                                                                />
                                                                <span className="font-medium text-sm text-gray-700">
                                                                    {moduleNames[module] || module}
                                                                </span>
                                                            </div>
                                                            <div className="px-6 py-2 grid grid-cols-2 gap-2">
                                                                {perms.map((perm) => (
                                                                    <label key={perm.id} className="flex items-center gap-2 text-sm">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedPermissions.has(perm.id)}
                                                                            onChange={() => togglePermission(perm.id)}
                                                                            className="w-4 h-4 rounded"
                                                                        />
                                                                        <span className="text-gray-600">{perm.name}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={() => handleUpdate(role.id)}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                                                >
                                                    Lưu thay đổi
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Quyền hạn:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.length > 0 ? (
                                            role.permissions.map((rp) => (
                                                <span
                                                    key={rp.permission.id}
                                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                                >
                                                    {rp.permission.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">Chưa có quyền nào</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {roles.length === 0 && !isAdding && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                    Chưa có vai trò nào. Nhấn &quot;Thêm vai trò&quot; để tạo mới.
                </div>
            )}
        </div>
    );
}
