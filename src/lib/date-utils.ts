/**
 * @file types.ts
 * @description Định nghĩa các kiểu dữ liệu (TypeScript Interfaces) dùng chung.
 * Giúp đảm bảo tính nhất quán của dữ liệu khi truyền giữa các Components và API.
 */

/**
 * Date type alias that accepts both Date objects and ISO strings
 * Prisma returns Date objects, but when data is serialized (e.g., via API)
 * it becomes a string. This type allows both.
 */
export type DateLike = Date | string;

/**
 * Helper to format DateLike to locale string
 */
export function formatDate(date: DateLike | null | undefined, locale = 'vi-VN', options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString(locale, options);
}

/**
 * Helper to format DateLike to datetime locale string
 */
export function formatDateTime(date: DateLike | null | undefined, locale = 'vi-VN', options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '';
    return new Date(date).toLocaleString(locale, options);
}

/**
 * Helper to get ISO date string (YYYY-MM-DD) from DateLike
 */
export function toISODateString(date: DateLike | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? date : date.toISOString();
    return d.split('T')[0];
}
