import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../server/auth.js'
import { userHasPermission, userHasAnyPermission } from '../services/userManagementService.js'

export interface AuthRequest extends Request {
  user?: {
    userId: number
    email: string
  }
}

/**
 * Middleware to extract and verify JWT token
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
}

/**
 * Middleware to check if user has a specific permission
 */
export function requirePermission(permissionName: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    try {
      const hasPermission = await userHasPermission(req.user.userId, permissionName)
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        })
      }

      next()
    } catch (error) {
      console.error('Error checking permission:', error)
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions'
      })
    }
  }
}

/**
 * Middleware to check if user has any of the specified permissions
 */
export function requireAnyPermission(permissionNames: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    try {
      const hasPermission = await userHasAnyPermission(req.user.userId, permissionNames)
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        })
      }

      next()
    } catch (error) {
      console.error('Error checking permissions:', error)
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions'
      })
    }
  }
}
