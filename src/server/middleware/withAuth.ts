/**
 * @file withAuth.ts
 * @description Middleware tập trung xác thực cho API Routes.
 * Thay thế pattern lặp `const session = await auth(); if (!session) return errorResponse(401)`
 * xuất hiện ~52 lần trong project.
 *
 * Cung cấp 3 wrapper:
 * - `withAuth`: Yêu cầu đăng nhập (401 nếu chưa)
 * - `withAdmin`: Yêu cầu quyền Administrator (403 nếu không phải admin)
 * - `withOptionalAuth`: Auth không bắt buộc (session có thể null)
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { errorResponse, handleApiError } from '@/lib/api-error';

// ============================================
// TYPES
// ============================================

/**
 * Session user information injected into authenticated requests
 */
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    isAdministrator: boolean;
}

/**
 * Route context for dynamic routes (e.g., /api/tasks/[id])
 */
export interface RouteContext<T extends Record<string, string> = Record<string, string>> {
    params: Promise<T>;
}

/**
 * Handler function for routes that require authentication.
 * `user` is guaranteed to be non-null.
 *
 * @example
 * // Route without params: GET /api/dashboard
 * export const GET = withAuth(async (req, user) => { ... });
 *
 * @example
 * // Route with params: GET /api/tasks/[id]
 * export const GET = withAuth(async (req, user, ctx) => {
 *   const { id } = await ctx.params;
 * });
 */
export type AuthenticatedHandler = (
    req: NextRequest,
    user: AuthUser,
    ctx: RouteContext,
) => Promise<Response>;

/**
 * Handler function for routes where auth is optional.
 * `user` can be null if not authenticated.
 */
export type OptionalAuthHandler = (
    req: NextRequest,
    user: AuthUser | null,
    ctx: RouteContext,
) => Promise<Response>;

// ============================================
// MIDDLEWARE: withAuth
// ============================================

/**
 * Wraps an API route handler with authentication check.
 * Returns 401 if user is not logged in.
 * Automatically catches and formats errors.
 *
 * @example
 * // src/app/api/tasks/route.ts
 * import { withAuth } from '@/server/middleware/withAuth';
 *
 * export const GET = withAuth(async (req, user) => {
 *   // `user` is guaranteed to exist here
 *   const tasks = await prisma.task.findMany({
 *     where: { assigneeId: user.id }
 *   });
 *   return successResponse(tasks);
 * });
 */
export function withAuth(handler: AuthenticatedHandler) {
    return async (req: NextRequest, ctx?: RouteContext) => {
        try {
            const session = await auth();

            if (!session?.user) {
                return errorResponse('Chưa đăng nhập', 401);
            }

            const user: AuthUser = {
                id: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
                isAdministrator: session.user.isAdministrator ?? false,
            };

            return await handler(req, user, ctx ?? { params: Promise.resolve({}) as Promise<Record<string, string>> });
        } catch (error) {
            return handleApiError(error);
        }
    };
}

// ============================================
// MIDDLEWARE: withAdmin
// ============================================

/**
 * Wraps an API route handler with administrator check.
 * Returns 401 if not logged in, 403 if not admin.
 *
 * @example
 * export const POST = withAdmin(async (req, user) => {
 *   // Only administrators reach here
 *   const role = await prisma.role.create({ ... });
 *   return successResponse(role, 201);
 * });
 */
export function withAdmin(handler: AuthenticatedHandler) {
    return async (req: NextRequest, ctx?: RouteContext) => {
        try {
            const session = await auth();

            if (!session?.user) {
                return errorResponse('Chưa đăng nhập', 401);
            }

            if (!session.user.isAdministrator) {
                return errorResponse('Không có quyền truy cập', 403);
            }

            const user: AuthUser = {
                id: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
                isAdministrator: true,
            };

            return await handler(req, user, ctx ?? { params: Promise.resolve({}) as Promise<Record<string, string>> });
        } catch (error) {
            return handleApiError(error);
        }
    };
}

// ============================================
// MIDDLEWARE: withOptionalAuth
// ============================================

/**
 * Wraps an API route handler where authentication is optional.
 * User will be null if not logged in. No error is returned.
 * Useful for public routes that show more data when authenticated.
 *
 * @example
 * export const GET = withOptionalAuth(async (req, user) => {
 *   if (user) {
 *     // Show personalized data
 *   } else {
 *     // Show public data
 *   }
 * });
 */
export function withOptionalAuth(handler: OptionalAuthHandler) {
    return async (req: NextRequest, ctx?: RouteContext) => {
        try {
            const session = await auth();

            const user: AuthUser | null = session?.user
                ? {
                    id: session.user.id,
                    name: session.user.name || '',
                    email: session.user.email || '',
                    isAdministrator: session.user.isAdministrator ?? false,
                }
                : null;

            return await handler(req, user, ctx ?? { params: Promise.resolve({}) as Promise<Record<string, string>> });
        } catch (error) {
            return handleApiError(error);
        }
    };
}
