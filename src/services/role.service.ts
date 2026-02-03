import { apiFetch } from '@/lib/api-fetch';
import type {
    ApiResponse,
    RoleWithPermissions,
    CreateRoleInput,
    UpdateRoleInput,
    UpdateRolePermissionsInput,
    UpdateRoleTrackersInput
} from '@/types';

export const roleService = {
    getAll: async () => {
        return apiFetch<ApiResponse<RoleWithPermissions[]>>('/api/roles');
    },

    getById: async (id: string) => {
        return apiFetch<ApiResponse<RoleWithPermissions>>(`/api/roles/${id}`);
    },

    create: async (data: CreateRoleInput) => {
        return apiFetch<ApiResponse<RoleWithPermissions>>('/api/roles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    clone: async (role: RoleWithPermissions) => {
        return apiFetch<ApiResponse<RoleWithPermissions>>('/api/roles', {
            method: 'POST',
            body: JSON.stringify({
                name: `${role.name} (Copy)`,
                description: role.description,
            }),
        });
    },

    update: async (id: string, data: UpdateRoleInput) => {
        return apiFetch<ApiResponse<RoleWithPermissions>>(`/api/roles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/roles/${id}`, {
            method: 'DELETE',
        });
    },

    updatePermissions: async (id: string, data: UpdateRolePermissionsInput) => {
        return apiFetch<void>(`/api/roles/${id}/permissions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateTrackers: async (id: string, data: UpdateRoleTrackersInput) => {
        return apiFetch<void>(`/api/roles/${id}/trackers`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};
