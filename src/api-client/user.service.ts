import { apiFetch } from '@/lib/api-fetch';
import {
    UserWithRoles,
    ApiResponse,
    SafeUser,
    CreateUserInput,
    UpdateUserInput
} from '@/types';



export const userService = {
    /**
     * Get all users
     */
    getAll: async () => {
        return apiFetch<UserWithRoles[]>('/api/users');
    },

    /**
     * Get user by ID
     */
    getById: async (id: string) => {
        return apiFetch<UserWithRoles>(`/api/users/${id}`);
    },

    /**
     * Create a new user
     */
    create: async (data: CreateUserInput) => {
        return apiFetch<ApiResponse<SafeUser>>('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update an existing user
     */
    update: async (id: string, data: UpdateUserInput) => {
        return apiFetch<ApiResponse<SafeUser>>(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete a user
     */
    delete: async (id: string) => {
        return apiFetch<ApiResponse>(`/api/users/${id}`, {
            method: 'DELETE',
        });
    },
};
