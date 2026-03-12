import { apiFetch } from '@/lib/api-fetch';
import type { ApiResponse, Tracker, CreateTrackerInput, UpdateTrackerInput } from '@/types';

export const trackerService = {
    getAll: async () => {
        return apiFetch<ApiResponse<Tracker[]>>('/api/trackers');
    },

    create: async (data: CreateTrackerInput) => {
        return apiFetch<ApiResponse<Tracker>>('/api/trackers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: UpdateTrackerInput) => {
        return apiFetch<ApiResponse<Tracker>>(`/api/trackers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/trackers/${id}`, {
            method: 'DELETE',
        });
    },

    setDefault: async (id: string) => {
        return apiFetch<void>(`/api/trackers/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ isDefault: true }),
        });
    },
};
