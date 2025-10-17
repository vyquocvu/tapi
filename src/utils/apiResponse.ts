/**
 * API Response Utilities
 * Provides standardized response formats for API endpoints
 */

export interface APISuccessResponse<T = any> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    pageSize?: number
    timestamp?: string
  }
}

export interface APIErrorResponse {
  success: false
  error: string
  details?: string | Record<string, any>
  code?: string
  timestamp?: string
}

export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: APISuccessResponse['meta']
): APISuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta: { ...meta, timestamp: new Date().toISOString() } }),
  }
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  details?: string | Record<string, any>,
  code?: string
): APIErrorResponse {
  return {
    success: false,
    error,
    ...(details && { details }),
    ...(code && { code }),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: Array<{ field: string; message: string }>
): APIErrorResponse {
  return {
    success: false,
    error: 'Validation failed',
    details: errors,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(message = 'Authentication required'): APIErrorResponse {
  return {
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message = 'Access denied'): APIErrorResponse {
  return {
    success: false,
    error: message,
    code: 'FORBIDDEN',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a not found error response
 */
export function notFoundResponse(resource = 'Resource'): APIErrorResponse {
  return {
    success: false,
    error: `${resource} not found`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a server error response
 */
export function serverErrorResponse(
  message = 'Internal server error',
  details?: string
): APIErrorResponse {
  return {
    success: false,
    error: message,
    ...(details && process.env.NODE_ENV !== 'production' && { details }),
    code: 'SERVER_ERROR',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a bad request error response
 */
export function badRequestResponse(
  message: string,
  details?: string | Record<string, any>
): APIErrorResponse {
  return {
    success: false,
    error: message,
    ...(details && { details }),
    code: 'BAD_REQUEST',
    timestamp: new Date().toISOString(),
  }
}

/**
 * HTTP Status codes for common API responses
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
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Map error types to HTTP status codes
 */
export function getStatusCodeForError(code?: string): number {
  switch (code) {
    case 'VALIDATION_ERROR':
    case 'BAD_REQUEST':
      return HTTP_STATUS.BAD_REQUEST
    case 'UNAUTHORIZED':
      return HTTP_STATUS.UNAUTHORIZED
    case 'FORBIDDEN':
      return HTTP_STATUS.FORBIDDEN
    case 'NOT_FOUND':
      return HTTP_STATUS.NOT_FOUND
    case 'SERVER_ERROR':
    default:
      return HTTP_STATUS.INTERNAL_SERVER_ERROR
  }
}
