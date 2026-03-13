import { PAGINATION } from './constants';

/**
 * Common pagination parameters
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

/**
 * Result of data fetching with pagination
 */
export interface PaginationResult {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

/**
 * Parse pagination params from search params
 */
export function parsePaginationParams(searchParams: URLSearchParams, defaultSortBy: string = 'updatedAt'): PaginationParams {
    let page = parseInt(searchParams.get('page') || '1');
    if (isNaN(page) || page < 1) page = 1;

    let pageSize = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || PAGINATION.DEFAULT_PAGE_SIZE.toString());
    if (isNaN(pageSize) || pageSize < 1) pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
    if (pageSize > PAGINATION.MAX_PAGE_SIZE) pageSize = PAGINATION.MAX_PAGE_SIZE;

    const sortBy = searchParams.get('sortBy') || defaultSortBy;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    return {
        page,
        pageSize,
        sortBy,
        sortOrder,
    };
}

/**
 * Build pagination result object
 */
export function buildPaginationResult(total: number, page: number, pageSize: number): PaginationResult {
    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
    };
}
