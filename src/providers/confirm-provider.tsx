/**
 * @file confirm-provider.tsx
 * @description
 * PROVIDER QUẢN LÝ HỘP THOẠI XÁC NHẬN TOÀN CỤC.
 * Gom state và UI của ConfirmModal vào một chỗ (layout gốc) để tái sử dụng.
 * Giúp các màn hình con có thể hiển thị hộp thoại xác nhận chỉ bằng một dòng code `confirm({...})`.
 */
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ConfirmModal } from "@/components/UI/ConfirmModal";

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);

    const confirm = useCallback((newOptions: ConfirmOptions) => {
        setOptions(newOptions);
        setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleConfirm = useCallback(() => {
        if (options?.onConfirm) {
            options.onConfirm();
        }
        setIsOpen(false);
    }, [options]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {options && (
                <ConfirmModal
                    isOpen={isOpen}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                    title={options.title}
                    description={options.description}
                    confirmText={options.confirmText}
                    cancelText={options.cancelText}
                    variant={options.variant}
                />
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context;
}
