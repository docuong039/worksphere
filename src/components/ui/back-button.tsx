'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    className?: string;
}

export function BackButton({ className }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={className || "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"}
            aria-label="Quay lại"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
    );
}
