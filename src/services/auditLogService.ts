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

// Audit log queue for batching (optional performance optimization)
let auditLogQueue: CreateAuditLogInput[] = []
let flushTimeout: NodeJS.Timeout | null = null
const BATCH_SIZE = 50
const BATCH_TIMEOUT_MS = 5000

/**
 * Flush queued audit logs to database
 */
async function flushAuditLogs(): Promise<void> {
  if (auditLogQueue.length === 0) return

  const logsToWrite = [...auditLogQueue]
  auditLogQueue = []

  try {
    await prisma.auditLog.createMany({
      data: logsToWrite.map(log => ({
        ...log,
        details: log.details ? JSON.stringify(log.details) : null
      }))
    })
  } catch (error) {
    console.error('Error flushing audit logs:', error)
    // Re-add failed logs to queue
    auditLogQueue.unshift(...logsToWrite)
  }
}

/**
 * Schedule a batch flush
 */
function scheduleBatchFlush(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout)
  }
  flushTimeout = setTimeout(() => {
    flushAuditLogs()
    flushTimeout = null
  }, BATCH_TIMEOUT_MS)
}

/**
 * Create an audit log entry (batched for performance)
 * Set batch=false for immediate write (important logs)
 */
export async function createAuditLog(
  input: CreateAuditLogInput,
  options: { batch?: boolean } = { batch: true }
): Promise<AuditLog | void> {
  // Immediate write for important logs or when batching disabled
  if (!options.batch) {
    return await prisma.auditLog.create({
      data: {
        ...input,
        details: input.details ? JSON.stringify(input.details) : null
      }
    })
  }

  // Add to batch queue
  auditLogQueue.push(input)

  // Flush if batch size reached
  if (auditLogQueue.length >= BATCH_SIZE) {
    await flushAuditLogs()
  } else {
    scheduleBatchFlush()
  }
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
