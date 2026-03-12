import { apiFetch } from '@/lib/api-fetch';
import type {
    ApiResponse,
    Priority,
    CreatePriorityInput,
    UpdatePriorityInput
} from '@/types';

export const priorityService = {
    getAll: async () => {
        return apiFetch<ApiResponse<Priority[]>>('/api/priorities');
    },

    create: async (data: CreatePriorityInput) => {
        return apiFetch<ApiResponse<Priority>>('/api/priorities', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: UpdatePriorityInput) => {
        return apiFetch<ApiResponse<Priority>>(`/api/priorities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/priorities/${id}`, {
            method: 'DELETE',
        });
    },

    setDefault: async (id: string) => {
        return apiFetch<void>(`/api/priorities/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ isDefault: true }),
        });
    },
};
