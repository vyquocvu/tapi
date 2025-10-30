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

// Internal type for queue management with retry tracking
interface QueuedAuditLog extends CreateAuditLogInput {
  _retryCount?: number
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
let auditLogQueue: QueuedAuditLog[] = []
let flushTimeout: NodeJS.Timeout | null = null
let isFlushingQueue = false // Prevent concurrent flushes
let isShuttingDown = false // Prevent multiple shutdown handlers
const BATCH_SIZE = 50
const BATCH_TIMEOUT_MS = 5000
const MAX_RETRY_ATTEMPTS = 3

/**
 * Flush queued audit logs to database
 */
async function flushAuditLogs(): Promise<void> {
  // Prevent concurrent flush operations
  if (isFlushingQueue || auditLogQueue.length === 0) return

  isFlushingQueue = true
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
    
    // Only retry if we haven't exceeded max attempts
    const retriableLogs = logsToWrite.filter((log) => {
      const retryCount = (log._retryCount || 0) + 1
      if (retryCount <= MAX_RETRY_ATTEMPTS) {
        log._retryCount = retryCount
        return true
      }
      // Log dropped entries for monitoring
      console.error('Dropping audit log after max retries:', log)
      return false
    })
    
    // Re-add retriable logs to queue
    if (retriableLogs.length > 0) {
      auditLogQueue.unshift(...retriableLogs)
    }
  } finally {
    isFlushingQueue = false
  }
}

/**
 * Schedule a batch flush with error handling
 */
function scheduleBatchFlush(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout)
  }
  flushTimeout = setTimeout(() => {
    flushAuditLogs().catch(err => {
      console.error('Error in scheduled audit log flush:', err)
    })
    flushTimeout = null
  }, BATCH_TIMEOUT_MS)
}

/**
 * Flush remaining logs on shutdown
 */
async function shutdownHandler(): Promise<void> {
  // Prevent multiple shutdown executions
  if (isShuttingDown) return
  isShuttingDown = true
  
  try {
    console.log('Flushing remaining audit logs...')
    if (flushTimeout) {
      clearTimeout(flushTimeout)
      flushTimeout = null
    }
    await flushAuditLogs()
    console.log('Audit logs flushed successfully')
  } catch (error) {
    console.error('Error during audit log shutdown:', error)
  }
}

// Register shutdown handlers
if (typeof process !== 'undefined') {
  process.on('beforeExit', shutdownHandler)
  process.on('SIGINT', () => {
    shutdownHandler().finally(() => process.exit(0))
  })
  process.on('SIGTERM', () => {
    shutdownHandler().finally(() => process.exit(0))
  })
}

/**
 * Create an audit log entry (immediate write)
 * Use this for critical logs that must be written immediately
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
 * Create an audit log entry with batching for better performance
 * Use this for non-critical logs that can tolerate slight delays
 */
export function createAuditLogBatched(input: CreateAuditLogInput): void {
  // Add to batch queue
  auditLogQueue.push(input)

  // Flush if batch size reached
  if (auditLogQueue.length >= BATCH_SIZE) {
    flushAuditLogs().catch(err => {
      console.error('Error flushing audit logs:', err)
    })
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
