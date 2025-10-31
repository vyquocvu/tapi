/**
 * Performance Monitor Plugin
 * Monitors request performance and logs slow requests
 */

import type { Plugin, PluginContext, PluginConfig } from '../../lib/plugin-system/types'

interface PerformanceOptions {
  slowRequestThreshold?: number // Threshold in ms to log as slow (default: 1000)
  trackMemory?: boolean // Track memory usage
}

export const performanceMonitorPlugin: Plugin = {
  name: 'performance-monitor',
  version: '1.0.0',
  description: 'Monitors API request performance',

  onRegister: async (config: PluginConfig) => {
    const options = config.options as PerformanceOptions
    console.log('[Performance Monitor] Plugin registered, slow threshold:', 
      options?.slowRequestThreshold || 1000, 'ms')
  },

  onBeforeRequest: async (context: PluginContext) => {
    const options = (context.state.get('options') as PerformanceOptions) || {
      slowRequestThreshold: 1000,
      trackMemory: false,
    }
    
    context.state.set('perfStartTime', Date.now())
    
    if (options.trackMemory) {
      context.state.set('perfStartMemory', process.memoryUsage())
    }
    
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    const startTime = context.state.get('perfStartTime') as number
    const duration = Date.now() - startTime
    
    const options = (context.state.get('options') as PerformanceOptions) || {
      slowRequestThreshold: 1000,
      trackMemory: false,
    }
    
    // Log slow requests
    if (duration > (options.slowRequestThreshold || 1000)) {
      const logData: any = {
        requestId: context.requestId,
        method: context.req.method,
        url: context.req.url,
        duration: `${duration}ms`,
        threshold: `${options.slowRequestThreshold}ms`,
      }
      
      if (options.trackMemory) {
        const startMemory = context.state.get('perfStartMemory') as NodeJS.MemoryUsage
        const endMemory = process.memoryUsage()
        const heapDelta = endMemory.heapUsed - startMemory.heapUsed
        const externalDelta = endMemory.external - startMemory.external
        
        logData.memoryDelta = {
          heapUsed: `${(Math.abs(heapDelta) / 1024 / 1024).toFixed(2)}MB${heapDelta < 0 ? ' freed' : ''}`,
          external: `${(Math.abs(externalDelta) / 1024 / 1024).toFixed(2)}MB${externalDelta < 0 ? ' freed' : ''}`,
        }
      }
      
      console.warn('[Performance Monitor] Slow request detected:', logData)
    }
    
    // Add performance header
    context.res.setHeader('X-Response-Time', `${duration}ms`)
    
    return response
  },
}
