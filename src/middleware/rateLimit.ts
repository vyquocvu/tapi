/**
 * Rate Limiting Middleware
 * Provides request rate limiting capabilities
 */

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp when the window resets
}

/**
 * In-memory store for rate limiting
 * In production, use Redis or similar distributed cache
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  increment(key: string, windowMs: number): RateLimitInfo {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new window
      const resetTime = now + windowMs
      this.store.set(key, { count: 1, resetTime })
      return {
        limit: 0, // Will be set by caller
        remaining: 0, // Will be calculated by caller
        reset: Math.floor(resetTime / 1000),
      }
    }

    // Increment existing window
    entry.count++
    return {
      limit: 0, // Will be set by caller
      remaining: 0, // Will be calculated by caller
      reset: Math.floor(entry.resetTime / 1000),
    }
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    
    const now = Date.now()
    if (now > entry.resetTime) {
      this.store.delete(key)
      return undefined
    }
    
    return entry
  }

  reset(key: string): void {
    this.store.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Global store instance
const defaultStore = new RateLimitStore()

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  DEFAULT: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests, please try again later',
  },
  AUTHENTICATED: {
    windowMs: 60000, // 1 minute
    maxRequests: 1000,
    message: 'Too many requests, please try again later',
  },
  CONTENT_CREATE: {
    windowMs: 60000, // 1 minute
    maxRequests: 50,
    message: 'Too many content creation requests, please slow down',
  },
  LOGIN: {
    windowMs: 300000, // 5 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later',
  },
} as const

/**
 * Get client identifier from request
 * Uses IP address by default, can be customized to use user ID for authenticated requests
 */
export function getClientIdentifier(req: any): string {
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const ip = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  
  return ip
}

/**
 * Check if a request is within rate limits
 * Returns rate limit info for response headers
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  store: RateLimitStore = defaultStore
): { allowed: boolean; info: RateLimitInfo } {
  const info = store.increment(identifier, config.windowMs)
  const entry = store.get(identifier)
  
  if (!entry) {
    // New window, allow request
    return {
      allowed: true,
      info: {
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: info.reset,
      },
    }
  }

  const allowed = entry.count <= config.maxRequests
  
  return {
    allowed,
    info: {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      reset: info.reset,
    },
  }
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(res: any, info: RateLimitInfo): void {
  res.setHeader('X-RateLimit-Limit', info.limit.toString())
  res.setHeader('X-RateLimit-Remaining', info.remaining.toString())
  res.setHeader('X-RateLimit-Reset', info.reset.toString())
}

/**
 * Apply rate limiting to a request
 * This is a helper function that can be used in API routes
 * 
 * @example
 * ```typescript
 * import { applyRateLimit, RATE_LIMITS } from './middleware/rateLimit'
 * 
 * // In your API handler
 * const rateLimitResult = applyRateLimit(req, res, RATE_LIMITS.DEFAULT)
 * if (!rateLimitResult.allowed) {
 *   return // Response already sent
 * }
 * ```
 */
export function applyRateLimit(
  req: any,
  res: any,
  config: RateLimitConfig
): { allowed: boolean; info: RateLimitInfo } {
  const identifier = getClientIdentifier(req)
  const result = checkRateLimit(identifier, config)
  
  setRateLimitHeaders(res, result.info)
  
  if (!result.allowed) {
    res.statusCode = 429
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Retry-After', Math.ceil((result.info.reset * 1000 - Date.now()) / 1000).toString())
    res.end(JSON.stringify({
      success: false,
      error: config.message || 'Too many requests',
      code: 'TOO_MANY_REQUESTS',
      retryAfter: result.info.reset,
      timestamp: new Date().toISOString(),
    }))
  }
  
  return result
}

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: any, res: any) => applyRateLimit(req, res, config)
}
