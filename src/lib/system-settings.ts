export type SettingMode = 'calculated' | 'independent';

export interface SystemSettings {
    parent_issue_dates: SettingMode;
    parent_issue_priority: SettingMode;
    parent_issue_done_ratio: SettingMode;
    parent_issue_estimated_hours: SettingMode;
}

const defaultSettings: SystemSettings = {
    parent_issue_dates: 'calculated',
    parent_issue_priority: 'calculated',
    parent_issue_done_ratio: 'calculated',
    parent_issue_estimated_hours: 'calculated',
};

// Luôn trả về mặc định vì đã bỏ tính năng cấu hình toàn hệ thống
export function getSystemSettings(): SystemSettings {
    return defaultSettings;
}

// Hàm này không còn tác dụng thực tế nhưng giữ lại để tránh break code (nếu có chỗ nào gọi), 
// nhưng tốt nhất là nên remove nơi gọi.
export function updateSystemSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    return { ...defaultSettings, ...newSettings };
}
