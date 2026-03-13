"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/UI/Dialog";
import { Button } from "@/components/UI/Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "danger",
    isLoading = false,
}: ConfirmModalProps) {
    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
            button: "bg-red-600 hover:bg-red-700 text-white",
            iconBg: "bg-red-100",
        },
        warning: {
            icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
            button: "bg-yellow-600 hover:bg-yellow-700 text-white",
            iconBg: "bg-yellow-100",
        },
        info: {
            icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
            button: "bg-blue-600 hover:bg-blue-700 text-white",
            iconBg: "bg-blue-100",
        },
    };

    const style = variantStyles[variant];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${style.iconBg} shrink-0`}>
                            {style.icon}
                        </div>
                        <div className="space-y-2">
                            <DialogHeader className="p-0 text-left">
                                <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
                                    {title}
                                </DialogTitle>
                                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                                    {description}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-gray-50/80 backdrop-blur-sm px-6 py-4 gap-3 mt-0 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="font-medium text-gray-600 hover:bg-gray-200/50"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        disabled={isLoading}
                        className={`font-semibold px-6 shadow-sm transition-all active:scale-95 ${style.button}`}
                    >
                        {isLoading ? "Đang xử lý..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
