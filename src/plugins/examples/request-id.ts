/**
 * Request ID Plugin
 * Adds unique request IDs to all requests and responses
 */

import type { Plugin, PluginContext, PluginConfig } from '../../lib/plugin-system/types'

export const requestIdPlugin: Plugin = {
  name: 'request-id',
  version: '1.0.0',
  description: 'Adds unique request IDs for tracing',

  onRegister: async (_config: PluginConfig) => {
    console.log('[Request ID] Plugin registered')
  },

  onBeforeRequest: async (context: PluginContext) => {
    // Check if request already has an ID (from client or load balancer)
    const existingId = context.req.headers['x-request-id'] as string
    
    if (existingId) {
      context.requestId = existingId
    }
    
    // Set request ID in response header
    context.res.setHeader('X-Request-ID', context.requestId)
    
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    // Add request ID to response body if it's an object
    if (response && typeof response === 'object') {
      return {
        ...response,
        requestId: context.requestId,
      }
    }
    
    return response
  },
}
