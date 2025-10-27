/**
 * Standard API response types and utilities
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Create a success response
 */
export function successResponse<T = any>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

/**
 * Create a paginated success response
 */
export function paginatedResponse<T = any>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number }
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
    },
  }
}

/**
 * Create an error response
 */
export function errorResponse(error: string, details?: any): ApiResponse {
  return {
    success: false,
    error,
    ...(details && { details }),
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors: string | string[]): ApiResponse {
  return {
    success: false,
    error: 'Validation failed',
    details: Array.isArray(errors) ? errors : [errors],
  }
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(message: string = 'Authentication required'): ApiResponse {
  return {
    success: false,
    error: message,
  }
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message: string = 'Access denied'): ApiResponse {
  return {
    success: false,
    error: message,
  }
}

/**
 * Create a not found error response
 */
export function notFoundResponse(resource: string = 'Resource'): ApiResponse {
  return {
    success: false,
    error: `${resource} not found`,
  }
}

/**
 * Create a bad request error response
 */
export function badRequestResponse(message: string): ApiResponse {
  return {
    success: false,
    error: message,
  }
}

/**
 * Create a server error response
 */
export function serverErrorResponse(message: string = 'Internal server error'): ApiResponse {
  return {
    success: false,
    error: message,
  }
}

/**
 * Create a method not allowed response
 */
export function methodNotAllowedResponse(allowedMethods: string[]): ApiResponse {
  return {
    success: false,
    error: 'Method not allowed',
    details: {
      allowedMethods,
    },
  }
}

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const
