import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'src/config/system-settings.json');

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

export function getSystemSettings(): SystemSettings {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            return defaultSettings;
        }
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return { ...defaultSettings, ...JSON.parse(data) };
    } catch (error) {
        console.error('Error reading system settings:', error);
        return defaultSettings;
    }
}

export function updateSystemSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    try {
        const currentSettings = getSystemSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };

        // Ensure config directory exists
        const configDir = path.dirname(SETTINGS_FILE);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf8');
        return updatedSettings;
    } catch (error) {
        console.error('Error updating system settings:', error);
        throw error;
    }
}
