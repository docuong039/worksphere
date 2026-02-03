import { apiFetch } from '@/lib/api-fetch';
import type { ApiResponse, ReportType } from '@/types';


export const reportService = {
    getReports: async (type: ReportType, startDate?: string, endDate?: string) => {
        const params: Record<string, string> = { type };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return apiFetch<ApiResponse<any>>('/api/reports', {
            params,
        });
    },
};
