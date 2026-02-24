import { PERMISSIONS } from '@/lib/constants';

interface User {
    id: string;
    isAdministrator: boolean;
}

/**
 * ReportPolicy
 * Quản lý tập trung các quy tắc truy cập cho module Báo cáo.
 */
export const ReportPolicy = {
    /**
     * Có thể xem báo cáo tổng quát và dự án không?
     * (Mọi thành viên có quyền truy cập hệ thống đều có thể xem báo cáo dự án mà họ tham gia)
     */
    canViewBasicReports: (user: User): boolean => {
        return true;
    },

    /**
     * Có thể xem báo cáo chi tiết theo nhân sự (Hiệu suất) không?
     * Quy tắc: Admin hoặc Project Managers (người có quyền projects.edit)
     */
    canViewUserReports: (user: User, userPermissions: string[]): boolean => {
        if (user.isAdministrator) return true;
        return userPermissions.includes(PERMISSIONS.PROJECTS.EDIT);
    },

    /**
     * Có thể xem báo cáo chấm công/thời gian không?
     * Quy tắc: Admin hoặc Project Managers
     */
    canViewTimeReports: (user: User, userPermissions: string[]): boolean => {
        if (user.isAdministrator) return true;
        return userPermissions.includes(PERMISSIONS.TIMELOGS.VIEW_ALL) ||
            userPermissions.includes(PERMISSIONS.PROJECTS.EDIT);
    },

    /**
     * Xác định phạm vi dữ liệu Task mà người dùng được phép xem trong báo cáo.
     * Trả về:
     * - 'ALL': Xem toàn bộ hệ thống (Admin hoặc Auditor công ty)
     * - 'PROJECT': Xem toàn bộ Task trong các dự án tham gia (Manager hoặc Team Lead)
     * - 'OWN': Chỉ xem Task được giao cho chính mình (Employee bình thường)
     */
    getTaskVisibilityScope: (user: User, userPermissions: string[]): 'ALL' | 'PROJECT' | 'OWN' => {
        if (user.isAdministrator || userPermissions.includes(PERMISSIONS.TASKS.VIEW_ALL)) {
            return 'ALL';
        }
        if (userPermissions.includes(PERMISSIONS.PROJECTS.EDIT) ||
            userPermissions.includes(PERMISSIONS.TASKS.VIEW_PROJECT)) {
            return 'PROJECT';
        }
        return 'OWN';
    },

    /**
     * Xác định phạm vi nhân sự mà người dùng được phép thấy trong báo cáo.
     * Trả về:
     * - 'ALL': Thấy mọi nhân viên (Admin/HR)
     * - 'PROJECT_MEMBERS': Thấy đồng nghiệp trong cùng dự án (Manager)
     * - 'SELF': Chỉ thấy chính mình (Employee)
     */
    getPersonnelVisibilityScope: (user: User, userPermissions: string[]): 'ALL' | 'PROJECT_MEMBERS' | 'SELF' => {
        if (user.isAdministrator || userPermissions.includes(PERMISSIONS.TASKS.VIEW_ALL)) {
            return 'ALL';
        }
        if (userPermissions.includes(PERMISSIONS.PROJECTS.EDIT)) {
            return 'PROJECT_MEMBERS';
        }
        return 'SELF';
    },
    /**
     * Có thể xem các thông số nhạy cảm trong Tab Tổng quan (VD: Tổng giờ làm) không?
     * Quy tắc: Chỉ những người có quyền quản lý nhân sự/dự án trong phạm vi của mình.
     */
    canViewSensitiveSummary: (user: User, userPermissions: string[]): boolean => {
        const scope = ReportPolicy.getPersonnelVisibilityScope(user, userPermissions);
        return scope === 'ALL' || scope === 'PROJECT_MEMBERS';
    }
};
