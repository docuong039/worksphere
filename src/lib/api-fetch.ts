/**
 * @file api-fetch.ts
 * @description Hàm tiện ích để thực hiện các HTTP requests (GET, POST, PUT, DELETE).
 * Tự động xử lý Base URL, Header Content-Type và kiểm tra lỗi xác thực (401).
 */
import { ApiResponse } from '@/types';

interface ApiFetchOptions extends RequestInit {
    // Add any custom options here
    params?: Record<string, string | number | boolean | undefined | null>;
}

// Custom error class for client-side API errors
// Named ApiClientError to distinguish from server-side ApiError in api-error.ts
export class ApiClientError extends Error {
    public status?: number;
    public data?: unknown;

    constructor(message: string, status?: number, data?: unknown) {
        super(message);
        this.name = 'ApiClientError';
        this.status = status;
        this.data = data;
    }
}

/**
 * A wrapper around the native fetch API for making API requests.
 * Automatically handles JSON headers and error parsing.
 */
export async function apiFetch<T = unknown>(
    url: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { params, headers = {}, ...fetchOptions } = options;

    // Handle query parameters
    let finalUrl = url;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            finalUrl += (url.includes('?') ? '&' : '?') + queryString;
        }
    }

    // Default headers
    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...fetchOptions,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
    };

    try {
        const response = await fetch(finalUrl, config);

        // Parse JSON response safely
        let data: unknown;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch {
                data = null; // Empty or invalid JSON
            }
        } else {
            // Check if there is text content (for HTML errors that sneak in)
            const text = await response.text();
            if (text && !response.ok && text.trim().startsWith('<')) {
                // It's likely an HTML error page (like Next.js error overlay or 404/500 page)
                console.error('API returned HTML instead of JSON:', text.substring(0, 100) + '...');
                throw new ApiClientError(
                    `Server Error (${response.statusText || response.status})`,
                    response.status
                );
            }
            data = text;
        }

        // Handle error responses (HTTP status not 200-299)
        if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText || response.status}`;

            // Try to extract message from common API response formats
            if (data && typeof data === 'object') {
                const apiRes = data as ApiResponse | { error?: string, message?: string };
                errorMessage = apiRes.error || apiRes.message || errorMessage;
            }

            throw new ApiClientError(errorMessage, response.status, data);
        }

        // Return the data directly
        return data as T;
    } catch (error) {
        if (error instanceof ApiClientError) {
            throw error;
        }

        // Network or other uncaught errors
        const message = error instanceof Error ? error.message : 'Unknown network error';
        console.error(`[ApiFetch] Failed request to ${url}:`, error);
        throw new ApiClientError(message);
    }
}
