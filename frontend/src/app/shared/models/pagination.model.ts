/**
 * Pagination Models - Matches backend PagedResponseDTO and PageRequestDTO.
 * See CONVENTIONS.md for contract rules.
 */

/**
 * Generic paged response from API.
 * Matches: PagedResponseDTO<T>
 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  sortBy?: string;
  sortDirection?: string;
  filterValue?: string;
}

/**
 * Pagination request parameters.
 * Matches: PageRequestDTO
 */
export interface PageRequest {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  search?: string;
  status?: string;
  type?: string;
  category?: string;  // GAP-021: Equipment category filter
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Sort configuration for table columns.
 */
export interface SortConfig {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Pagination state for components.
 */
export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort?: SortConfig;
  search?: string;
  filters?: Record<string, string>;
}

/**
 * Default pagination settings.
 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Build query params from PageRequest.
 */
export function toQueryParams(request: PageRequest): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (request.page !== undefined) params['page'] = request.page;
  if (request.size !== undefined) params['size'] = request.size;
  if (request.sortBy) params['sortBy'] = request.sortBy;
  if (request.sortDirection) params['sortDirection'] = request.sortDirection;
  if (request.search) params['search'] = request.search;
  if (request.status) params['status'] = request.status;
  if (request.type) params['type'] = request.type;
  if (request.category) params['category'] = request.category;  // GAP-021
  if (request.dateFrom) params['dateFrom'] = request.dateFrom;
  if (request.dateTo) params['dateTo'] = request.dateTo;

  return params;
}

/**
 * Create an empty paged response.
 */
export function emptyPagedResponse<T>(): PagedResponse<T> {
  return {
    content: [],
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };
}
