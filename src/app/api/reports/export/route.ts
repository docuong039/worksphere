import { errorResponse } from '@/lib/api-error';
import { withAuth } from '@/server/middleware/withAuth';
import { ReportServerService } from '@/server/services/report.server';

// GET /api/reports/export - Export data as CSV
export const GET = withAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const { content, filename } = await ReportServerService.getExportData(user, searchParams);

        // Return CSV response
        const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });

        return new Response(blob, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}.csv"`,
            },
        });
    } catch (error: any) {
        const isForbidden = error.message.includes('quyền');
        return errorResponse(error.message, isForbidden ? 403 : 400);
    }
});
