interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function successResponse<T>(data: T, meta?: PaginationMeta) {
  return { success: true as const, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(code: string, message: string, details?: unknown) {
  return { success: false as const, error: { code, message, ...(details ? { details } : {}) } };
}
