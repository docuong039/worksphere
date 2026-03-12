import { apiFetch } from '@/lib/api-fetch';
import { ActivityListResponse } from '@/types';


export const activityService = {
    /**
     * Get activities with filtering
     */
    getAll: async (params: { page?: number; limit?: number; userId?: string | null }) => {
        return apiFetch<ActivityListResponse>('/api/activity', {
            params,
        });
    },
};
