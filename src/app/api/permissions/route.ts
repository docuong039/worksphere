import { successResponse, errorResponse } from '@/lib/api-error';
import { PermissionServerService } from '@/server/services/permission.server';

// GET /api/permissions - Lấy tất cả permissions (grouped by module)
export async function GET() {
    try {
        const result = await PermissionServerService.getPermissions();
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message || 'Lỗi hệ thống', 500);
    }
}
