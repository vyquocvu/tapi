/**
 * Plugin Template
 * Use this as a starting point for creating custom plugins
 */

import type { Plugin, PluginContext, PluginConfig } from '../../lib/plugin-system/types'

// Define plugin-specific options
interface MyPluginOptions {
  // Add your custom options here
  enabled?: boolean
  customOption?: string
}

export const myPlugin: Plugin = {
  // Required: Unique plugin name
  name: 'my-plugin',
  
  // Optional: Plugin version
  version: '1.0.0',
  
  // Optional: Plugin description
  description: 'Description of what your plugin does',

  /**
   * Called when plugin is registered
   * Use for initialization, validation, and setup
   */
  onRegister: async (config: PluginConfig) => {
    const options = config.options as MyPluginOptions
    console.log(`[${config.name}] Plugin registered with options:`, options)
    
    // Perform any initialization here
    // Throw an error if initialization fails
  },

  /**
   * Called before request processing
   * Can modify request, add to context, or short-circuit
   * Return false to stop request processing
   */
  onBeforeRequest: async (context: PluginContext) => {
    // Access request data
    const { state } = context
    // const { req, res, user, requestId } = context // Available if needed
    
    // Store data in context for later use
    state.set('myData', { timestamp: Date.now() })
    
    // Access plugin options from context if needed
    // const options = state.get('options') as MyPluginOptions
    
    // Modify request headers if needed
    // req.headers['x-custom-header'] = 'value'
    
    // Return true to continue, false to stop
    return true
  },

  /**
   * Called after successful request processing
   * Can modify response before sending
   */
  onAfterRequest: async (_context: PluginContext, response: any) => {
    // Access stored data from context
    // const myData = _context.state.get('myData')
    
    // Modify response if needed
    // Make sure to return the modified response
    return response
  },

  /**
   * Called when an error occurs
   * Can handle error, log it, or transform it
   */
  onError: async (context: PluginContext, error: Error) => {
    // Log error or perform error handling
    console.error(`[${myPlugin.name}] Error occurred:`, {
      requestId: context.requestId,
      url: context.req.url,
      error: error.message,
    })
    
    // You can also rethrow or throw a different error
    // throw new Error('Custom error message')
  },

  /**
   * Called when plugin is unregistered
   * Use for cleanup
   */
  onUnregister: async () => {
    console.log(`[${myPlugin.name}] Plugin unregistered`)
    
    // Perform any cleanup here
  },
}

// Usage example:
// import { pluginManager } from '@/lib/plugin-system'
// import { myPlugin } from './path/to/my-plugin'
//
// await pluginManager.register(myPlugin, {
//   priority: 50,
//   routes: ['/api/*'],
//   options: {
//     enabled: true,
//     customOption: 'value',
//   },
// })
