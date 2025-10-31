/**
 * Plugin System Types
 * Core type definitions for the extensible plugin architecture
 */

import type { Connect } from 'vite'

/**
 * Plugin context provides access to request, response, and shared state
 */
export interface PluginContext {
  req: Connect.IncomingMessage
  res: any
  state: Map<string, any> // Shared state between plugins
  user?: any // Authenticated user if available
  requestId: string // Unique request identifier
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  name: string
  enabled?: boolean
  priority?: number // Lower numbers execute first (default: 100)
  routes?: string[] // Route patterns to apply plugin to (empty = all routes)
  excludeRoutes?: string[] // Route patterns to exclude
  options?: Record<string, any> // Plugin-specific options
}

/**
 * Plugin lifecycle hooks
 */
export interface Plugin {
  name: string
  version?: string
  description?: string
  
  /**
   * Called when plugin is registered
   * Use for initialization, validation, setup
   */
  onRegister?: (config: PluginConfig) => void | Promise<void>
  
  /**
   * Called before request processing
   * Can modify request, add to context, or short-circuit
   * Return false or throw to stop request processing
   */
  onBeforeRequest?: (context: PluginContext) => boolean | Promise<boolean> | void | Promise<void>
  
  /**
   * Called after successful request processing
   * Can modify response before sending
   */
  onAfterRequest?: (context: PluginContext, response: any) => any | Promise<any>
  
  /**
   * Called when an error occurs
   * Can handle error, transform it, or rethrow
   */
  onError?: (context: PluginContext, error: Error) => void | Promise<void>
  
  /**
   * Called when plugin is unregistered
   * Use for cleanup
   */
  onUnregister?: () => void | Promise<void>
}

/**
 * Middleware function signature
 * Compatible with Express-style middleware
 */
export type MiddlewareFunction = (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => void | Promise<void>

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  name: string
  handler: MiddlewareFunction
  priority?: number // Lower numbers execute first (default: 100)
  routes?: string[] // Route patterns to apply middleware to
  excludeRoutes?: string[] // Route patterns to exclude
}

/**
 * Plugin registry state
 */
export interface PluginRegistry {
  plugins: Map<string, { plugin: Plugin; config: PluginConfig }>
  middleware: MiddlewareConfig[]
}

/**
 * Plugin execution result
 */
export interface PluginExecutionResult {
  success: boolean
  shouldContinue: boolean // Whether to continue to next plugin/handler
  error?: Error
  response?: any
}
