/**
 * Response utilities for Connect middleware
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  message?: string
}

export function successResponse<T = any>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

export function errorResponse(error: string, details?: any): ApiResponse {
  return {
    success: false,
    error,
    ...(details && { details }),
  }
}

export function sendJson(res: any, statusCode: number, data: any): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}
