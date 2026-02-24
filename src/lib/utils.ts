/**
 * @file utils.ts
 * @description Các hàm tiện ích hỗ trợ định dạng dữ liệu.
 * Chứa các hàm hỗ trợ như định dạng ngày tháng, tiền tệ, hoặc xử lý chuỗi.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
