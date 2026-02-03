import { apiFetch } from '@/lib/api-fetch';
import type {
    ApiResponse,
    Status,
    CreateStatusInput,
    UpdateStatusInput
} from '@/types';

export const statusService = {
    getAll: async () => {
        return apiFetch<ApiResponse<Status[]>>('/api/statuses');
    },

    create: async (data: CreateStatusInput) => {
        return apiFetch<ApiResponse<Status>>('/api/statuses', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: UpdateStatusInput) => {
        return apiFetch<ApiResponse<Status>>(`/api/statuses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/statuses/${id}`, {
            method: 'DELETE',
        });
    },

    setDefault: async (id: string) => {
        return apiFetch<void>(`/api/statuses/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ isDefault: true }),
        });
    },
};
