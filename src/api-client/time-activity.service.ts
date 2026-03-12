import { apiFetch } from '@/lib/api-fetch';
import type {
    ApiResponse,
    TimeEntryActivity,
    CreateTimeEntryActivityInput,
    UpdateTimeEntryActivityInput
} from '@/types';

export const timeActivityService = {
    getAll: async (params?: { includeInactive?: boolean }) => {
        const query = params?.includeInactive ? '?includeInactive=true' : '';
        return apiFetch<ApiResponse<TimeEntryActivity[]>>(`/api/time-entry-activities${query}`);
    },

    create: async (data: CreateTimeEntryActivityInput) => {
        return apiFetch<ApiResponse<TimeEntryActivity>>('/api/time-entry-activities', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: UpdateTimeEntryActivityInput) => {
        return apiFetch<ApiResponse<TimeEntryActivity>>(`/api/time-entry-activities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/time-entry-activities/${id}`, {
            method: 'DELETE',
        });
    },
};
