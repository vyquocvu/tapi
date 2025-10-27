import { userHasPermission, userHasAnyPermission } from '../services/userManagementService.js'
import { createAuditLog } from '../services/auditLogService.js'

export interface PermissionCheckResult {
  allowed: boolean
  error?: string
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: number,
  permissionName: string,
  resourceDetails?: {
    resource: string
    resourceId?: number
    action: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<PermissionCheckResult> {
  try {
    const hasPermission = await userHasPermission(userId, permissionName)

    // Log denied access attempts
    if (!hasPermission && resourceDetails) {
      await createAuditLog({
        userId,
        action: 'denied',
        resource: resourceDetails.resource,
        resourceId: resourceDetails.resourceId,
        details: {
          permission: permissionName,
          attemptedAction: resourceDetails.action,
        },
        ipAddress: resourceDetails.ipAddress,
        userAgent: resourceDetails.userAgent,
      })
    }

    return {
      allowed: hasPermission,
      error: hasPermission ? undefined : 'Insufficient permissions',
    }
  } catch (error) {
    console.error('Error checking permission:', error)
    return {
      allowed: false,
      error: 'Error checking permissions',
    }
  }
}

/**
 * Check if a user has any of the specified permissions
 */
export async function checkAnyPermission(
  userId: number,
  permissionNames: string[],
  resourceDetails?: {
    resource: string
    resourceId?: number
    action: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<PermissionCheckResult> {
  try {
    const hasPermission = await userHasAnyPermission(userId, permissionNames)

    // Log denied access attempts
    if (!hasPermission && resourceDetails) {
      await createAuditLog({
        userId,
        action: 'denied',
        resource: resourceDetails.resource,
        resourceId: resourceDetails.resourceId,
        details: {
          permissions: permissionNames,
          attemptedAction: resourceDetails.action,
        },
        ipAddress: resourceDetails.ipAddress,
        userAgent: resourceDetails.userAgent,
      })
    }

    return {
      allowed: hasPermission,
      error: hasPermission ? undefined : 'Insufficient permissions',
    }
  } catch (error) {
    console.error('Error checking permissions:', error)
    return {
      allowed: false,
      error: 'Error checking permissions',
    }
  }
}
