import { apiFetch } from '@/lib/api-fetch';
import type {
    ApiResponse,
    TaskWithRelations,
    CreateTaskInput,
    UpdateTaskInput,
    TaskFilters // Using TaskFilters for params
} from '@/types';

export interface TaskAggregation {
    totalHours: number;
}


export interface TaskListResponse {
    tasks: TaskWithRelations[];
    aggregations?: TaskAggregation;
}

export const taskService = {
    getAll: async (params: TaskFilters = {}) => {
        return apiFetch<ApiResponse<TaskListResponse>>('/api/tasks', {
            params: params as unknown as Record<string, string>,
        });
    },

    getById: async (id: string) => {
        return apiFetch<ApiResponse<TaskWithRelations>>(`/api/tasks/${id}`);
    },

    create: async (data: CreateTaskInput) => {
        return apiFetch<ApiResponse<TaskWithRelations>>('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: UpdateTaskInput) => {
        return apiFetch<ApiResponse<TaskWithRelations>>(`/api/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiFetch<void>(`/api/tasks/${id}`, {
            method: 'DELETE',
        });
    },

    // Sub-resources: Comments
    addComment: async (taskId: string, content: string) => {
        return apiFetch<void>(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    updateComment: async (taskId: string, commentId: string, content: string) => {
        return apiFetch<void>(`/api/tasks/${taskId}/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    deleteComment: async (taskId: string, commentId: string) => {
        return apiFetch<void>(`/api/tasks/${taskId}/comments/${commentId}`, {
            method: 'DELETE',
        });
    },
};
