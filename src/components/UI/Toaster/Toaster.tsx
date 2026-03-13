'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
    return (
        <SonnerToaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                classNames: {
                    toast: 'bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex items-start gap-3',
                    title: 'text-sm font-semibold text-gray-900',
                    description: 'text-sm text-gray-600',
                    success: 'bg-emerald-50 border-emerald-200 [&>svg]:text-emerald-500',
                    error: 'bg-red-50 border-red-200 [&>svg]:text-red-500',
                    warning: 'bg-amber-50 border-amber-200 [&>svg]:text-amber-500',
                    info: 'bg-blue-50 border-blue-200 [&>svg]:text-blue-500',
                },
            }}
            richColors
            closeButton
        />
    );
}
