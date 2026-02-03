import { apiFetch } from '@/lib/api-fetch';
import type {
    ApiResponse,
    ProjectWithMembers,
    ProjectMemberWithRole,
    CreateProjectInput,
    UpdateProjectInput,
    CreateVersionInput,
    UpdateVersionInput,
    AddProjectMemberInput,
    UpdateProjectMemberRoleInput,
    UpdateProjectTrackersInput,
    VersionWithStats
} from '@/types';

export const projectService = {
    getAll: async () => {
        return apiFetch<ApiResponse<ProjectWithMembers[]>>('/api/projects');
    },

    getById: async (id: string) => {
        return apiFetch<ApiResponse<ProjectWithMembers>>(`/api/projects/${id}`);
    },

    create: async (data: CreateProjectInput) => {
        return apiFetch<ApiResponse<ProjectWithMembers>>('/api/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: UpdateProjectInput) => {
        return apiFetch<ApiResponse<ProjectWithMembers>>(`/api/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/projects/${id}`, {
            method: 'DELETE',
        });
    },

    archive: async (id: string) => {
        return apiFetch<void>(`/api/projects/${id}/archive`, {
            method: 'POST',
        });
    },

    // Member Management
    getMembers: async (projectId: string, params?: { assignable?: string }) => {
        return apiFetch<ApiResponse<ProjectMemberWithRole[]>>(`/api/projects/${projectId}/members`, {
            params,
        });
    },

    addMembers: async (projectId: string, data: AddProjectMemberInput) => {
        return apiFetch<void>(`/api/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateMemberRole: async (projectId: string, memberId: string, data: UpdateProjectMemberRoleInput) => {
        return apiFetch<void>(`/api/projects/${projectId}/members/${memberId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    removeMember: async (projectId: string, memberId: string) => {
        return apiFetch<void>(`/api/projects/${projectId}/members/${memberId}`, {
            method: 'DELETE',
        });
    },

    // Versions
    getVersions: async (projectId: string) => {
        return apiFetch<ApiResponse<VersionWithStats[]>>(`/api/projects/${projectId}/versions`);
    },

    createVersion: async (projectId: string, data: CreateVersionInput) => {
        return apiFetch<ApiResponse<VersionWithStats>>(`/api/projects/${projectId}/versions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateVersion: async (versionId: string, data: UpdateVersionInput) => {
        return apiFetch<ApiResponse<VersionWithStats>>(`/api/versions/${versionId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteVersion: async (versionId: string) => {
        return apiFetch<void>(`/api/versions/${versionId}`, {
            method: 'DELETE',
        });
    },

    // Settings
    updateTrackers: async (projectId: string, data: UpdateProjectTrackersInput) => {
        return apiFetch<void>(`/api/projects/${projectId}/trackers`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },


};
