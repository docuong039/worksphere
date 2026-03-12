import { apiFetch } from '@/lib/api-fetch';
import type { ApiResponse, UpdateWorkflowInput } from '@/types';


export const workflowService = {
    update: async (data: UpdateWorkflowInput) => {
        return apiFetch<void>('/api/workflow', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
