/**
 * Plugin Executor
 * Handles execution of plugins and middleware in the request/response lifecycle
 */

import type { Connect } from 'vite'
import { pluginManager } from './registry'
import type { PluginContext, PluginExecutionResult } from './types'
import { randomUUID } from 'crypto'

/**
 * Execute middleware chain for a request
 */
export async function executeMiddleware(
  req: Connect.IncomingMessage,
  res: any
): Promise<{ success: boolean; error?: Error }> {
  const route = req.url || '/'
  const middleware = pluginManager.getMiddlewareForRoute(route)

  if (middleware.length === 0) {
    return { success: true }
  }

  try {
    // Execute middleware in order
    for (const config of middleware) {
      await new Promise<void>((resolve, reject) => {
        config.handler(req, res, (error?: Error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Create plugin context for request
 */
function createPluginContext(req: Connect.IncomingMessage, res: any, user?: any): PluginContext {
  // Reuse existing request ID if available
  const existingRequestId = req.headers['x-request-id'] as string
  
  return {
    req,
    res,
    state: new Map(),
    user,
    requestId: existingRequestId || randomUUID(),
  }
}

/**
 * Execute onBeforeRequest hooks for all applicable plugins
 */
export async function executeBeforeRequest(
  req: Connect.IncomingMessage,
  res: any,
  user?: any
): Promise<PluginExecutionResult & { context?: PluginContext }> {
  const route = req.url || '/'
  const plugins = pluginManager.getPluginsForRoute(route)
  const context = createPluginContext(req, res, user)

  try {
    for (const { plugin, config } of plugins) {
      if (!config.enabled || !plugin.onBeforeRequest) continue

      // Pass plugin options to context
      if (config.options) {
        context.state.set('options', config.options)
      }

      const result = await plugin.onBeforeRequest(context)
      
      // If plugin returns false, stop processing
      if (result === false) {
        return {
          success: true,
          shouldContinue: false,
        }
      }
    }

    return {
      success: true,
      shouldContinue: true,
      context, // Return context for reuse
    }
  } catch (error) {
    return {
      success: false,
      shouldContinue: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Execute onAfterRequest hooks for all applicable plugins
 */
export async function executeAfterRequest(
  req: Connect.IncomingMessage,
  res: any,
  response: any,
  user?: any,
  existingContext?: PluginContext
): Promise<any> {
  const route = req.url || '/'
  const plugins = pluginManager.getPluginsForRoute(route)
  const context = existingContext || createPluginContext(req, res, user)

  let modifiedResponse = response

  try {
    for (const { plugin, config } of plugins) {
      if (!config.enabled || !plugin.onAfterRequest) continue

      // Pass plugin options to context
      if (config.options) {
        context.state.set('options', config.options)
      }

      const result = await plugin.onAfterRequest(context, modifiedResponse)
      if (result !== undefined) {
        modifiedResponse = result
      }
    }
  } catch (error) {
    console.error('[Plugin System] Error in onAfterRequest:', error)
    // Don't fail the request if post-processing fails
  }

  return modifiedResponse
}

/**
 * Execute onError hooks for all applicable plugins
 */
export async function executeOnError(
  req: Connect.IncomingMessage,
  res: any,
  error: Error,
  user?: any,
  existingContext?: PluginContext
): Promise<void> {
  const route = req.url || '/'
  const plugins = pluginManager.getPluginsForRoute(route)
  const context = existingContext || createPluginContext(req, res, user)

  for (const { plugin, config } of plugins) {
    if (!config.enabled || !plugin.onError) continue

    try {
      await plugin.onError(context, error)
    } catch (hookError) {
      console.error(`[Plugin System] Error in ${plugin.name}.onError:`, hookError)
      // Don't let plugin error handlers fail the error handling
    }
  }
}

/**
 * Wrap an API handler with plugin execution
 */
export function withPlugins(
  handler: (req: Connect.IncomingMessage, res: any) => Promise<void>
) {
  return async (req: Connect.IncomingMessage, res: any) => {
    let sharedContext: PluginContext | undefined
    
    try {
      // Execute middleware
      const middlewareResult = await executeMiddleware(req, res)
      if (!middlewareResult.success) {
        throw middlewareResult.error
      }

      // Execute before request hooks
      const beforeResult = await executeBeforeRequest(req, res)
      if (!beforeResult.success) {
        throw beforeResult.error
      }

      // Store context for reuse
      sharedContext = beforeResult.context

      if (!beforeResult.shouldContinue) {
        // Plugin stopped the request
        return
      }

      // Execute the actual handler
      await handler(req, res)
    } catch (error) {
      // Execute error hooks with shared context
      await executeOnError(req, res, error instanceof Error ? error : new Error(String(error)), undefined, sharedContext)
      
      // If error wasn't already sent, send it now
      if (!res.writableEnded) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error),
        }))
      }
    }
  }
}
