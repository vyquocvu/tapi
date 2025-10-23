import prisma from '../db/prisma.js'

export interface CreateAuditLogInput {
  userId?: number
  action: string
  resource: string
  resourceId?: number
  details?: any
  ipAddress?: string
  userAgent?: string
}

export interface AuditLog {
  id: number
  userId: number | null
  action: string
  resource: string
  resourceId: number | null
  details: any | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  return await prisma.auditLog.create({
    data: {
      ...input,
      details: input.details ? JSON.stringify(input.details) : null
    }
  })
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: number
  resource?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<AuditLog[]> {
  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.resource) where.resource = filters.resource
  if (filters.action) where.action = filters.action
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resource: string,
  resourceId: number,
  limit = 50
): Promise<AuditLog[]> {
  return await prisma.auditLog.findMany({
    where: {
      resource,
      resourceId
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limit = 100): Promise<AuditLog[]> {
  return await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}
