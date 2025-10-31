/**
 * Request Logger Plugin
 * Logs all API requests with timing information
 */

import type { Plugin, PluginContext, PluginConfig } from '../../lib/plugin-system/types'

interface LoggerOptions {
  logBody?: boolean
  logHeaders?: boolean
  logResponse?: boolean
}

export const requestLoggerPlugin: Plugin = {
  name: 'request-logger',
  version: '1.0.0',
  description: 'Logs API requests with timing and metadata',

  onRegister: async (config: PluginConfig) => {
    console.log('[Request Logger] Plugin registered with options:', config.options)
  },

  onBeforeRequest: async (context: PluginContext) => {
    const { req } = context
    const startTime = Date.now()
    
    // Store start time in context for later use
    context.state.set('requestStartTime', startTime)
    
    // Get options from plugin config
    const options = context.state.get('options') as LoggerOptions || {}
    
    const logData: any = {
      requestId: context.requestId,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.socket?.remoteAddress,
    }
    
    if (options.logHeaders) {
      logData.headers = req.headers
    }
    
    console.log('[Request Logger] Incoming request:', JSON.stringify(logData, null, 2))
    
    // Continue processing
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    const startTime = context.state.get('requestStartTime') as number
    const duration = Date.now() - startTime
    const options = context.state.get('options') as LoggerOptions || {}
    
    const logData: any = {
      requestId: context.requestId,
      method: context.req.method,
      url: context.req.url,
      duration: `${duration}ms`,
      statusCode: context.res.statusCode,
      timestamp: new Date().toISOString(),
    }
    
    if (options.logResponse && response) {
      logData.response = response
    }
    
    console.log('[Request Logger] Request completed:', JSON.stringify(logData, null, 2))
    
    return response
  },

  onError: async (context: PluginContext, error: Error) => {
    const startTime = context.state.get('requestStartTime') as number
    const duration = startTime ? Date.now() - startTime : 0
    
    console.error('[Request Logger] Request failed:', {
      requestId: context.requestId,
      method: context.req.method,
      url: context.req.url,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  },

  onUnregister: async () => {
    console.log('[Request Logger] Plugin unregistered')
  },
}
