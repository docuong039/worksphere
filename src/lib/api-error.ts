import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Type for field-level validation errors
export interface ApiFieldError {
    field?: string;
    message: string;
}

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public errors?: ApiFieldError[]
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    // Zod validation error
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: 'Dữ liệu không hợp lệ',
                errors: error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message, // Thông báo từ schema đã là tiếng Việt
                })),
            },
            { status: 400 }
        );
    }

    // Custom API error
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                errors: error.errors,
            },
            { status: error.statusCode }
        );
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
            const target = (error.meta?.target as string[]) || [];
            const fieldName = target.join(', ');
            return NextResponse.json(
                {
                    success: false,
                    error: `Dữ liệu đã tồn tại trong hệ thống (${fieldName})`,
                    field: error.meta?.target,
                },
                { status: 409 }
            );
        }

        // Foreign key constraint violation
        if (error.code === 'P2003') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không thể thực hiện vì dữ liệu liên quan không tồn tại hoặc đang được sử dụng',
                },
                { status: 400 }
            );
        }

        // Record not found
        if (error.code === 'P2025') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không tìm thấy bản ghi yêu cầu',
                },
                { status: 404 }
            );
        }
    }

    // Generic error
    return NextResponse.json(
        {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi hệ thống không xác định',
        },
        { status: 500 }
    );
}

export function successResponse<T>(data: T, status: number = 200) {
    return NextResponse.json(
        {
            success: true,
            data,
        },
        { status }
    );
}

export function errorResponse(message: string, status: number = 400, errors?: ApiFieldError[]) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            errors,
        },
        { status }
    );
}
