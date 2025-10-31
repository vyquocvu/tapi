/**
 * Response Transformer Plugin
 * Transforms API responses to a standardized format
 */

import type { Plugin, PluginContext, PluginConfig } from '../../lib/plugin-system/types'

interface TransformerOptions {
  wrapData?: boolean // Wrap response in { data: ... }
  addMetadata?: boolean // Add metadata like timestamp, version
  apiVersion?: string
}

export const responseTransformerPlugin: Plugin = {
  name: 'response-transformer',
  version: '1.0.0',
  description: 'Transforms responses to a standardized format',

  onRegister: async (config: PluginConfig) => {
    console.log('[Response Transformer] Plugin registered with options:', config.options)
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    const options = (context.state.get('options') as TransformerOptions) || {
      wrapData: true,
      addMetadata: true,
      apiVersion: 'v1',
    }
    
    // Skip if response is not an object or already has standard format
    if (!response || typeof response !== 'object') {
      return response
    }
    
    // If response already has success/error structure, don't transform
    if ('success' in response || 'error' in response) {
      return response
    }
    
    let transformed: any = response
    
    // Wrap data if requested
    if (options.wrapData && !('data' in response)) {
      transformed = { data: response }
    }
    
    // Add metadata if requested
    if (options.addMetadata) {
      transformed = {
        ...transformed,
        meta: {
          timestamp: new Date().toISOString(),
          version: options.apiVersion || 'v1',
          requestId: context.requestId,
        },
      }
    }
    
    return transformed
  },
}
