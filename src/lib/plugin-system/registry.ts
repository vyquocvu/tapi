/**
 * Plugin Registry
 * Core plugin registration and management system
 */

import type { Plugin, PluginConfig, PluginRegistry, MiddlewareConfig } from './types'

class PluginManager {
  private registry: PluginRegistry = {
    plugins: new Map(),
    middleware: [],
  }

  /**
   * Register a new plugin
   */
  async register(plugin: Plugin, config?: Partial<PluginConfig>): Promise<void> {
    const pluginConfig: PluginConfig = {
      name: plugin.name,
      enabled: config?.enabled ?? true,
      priority: config?.priority ?? 100,
      routes: config?.routes,
      excludeRoutes: config?.excludeRoutes,
      options: config?.options,
    }

    // Check if plugin already registered
    if (this.registry.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }

    // Call onRegister hook
    if (plugin.onRegister) {
      await plugin.onRegister(pluginConfig)
    }

    // Store plugin
    this.registry.plugins.set(plugin.name, { plugin, config: pluginConfig })

    console.log(`[Plugin System] Registered plugin: ${plugin.name}`)
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    const entry = this.registry.plugins.get(pluginName)
    if (!entry) {
      throw new Error(`Plugin "${pluginName}" is not registered`)
    }

    // Call onUnregister hook
    if (entry.plugin.onUnregister) {
      await entry.plugin.onUnregister()
    }

    this.registry.plugins.delete(pluginName)
    console.log(`[Plugin System] Unregistered plugin: ${pluginName}`)
  }

  /**
   * Register middleware
   */
  registerMiddleware(config: MiddlewareConfig): void {
    // Check if middleware with same name exists
    const existingIndex = this.registry.middleware.findIndex(m => m.name === config.name)
    if (existingIndex >= 0) {
      throw new Error(`Middleware "${config.name}" is already registered`)
    }

    // Add middleware and sort by priority
    this.registry.middleware.push({
      ...config,
      priority: config.priority ?? 100,
    })
    
    this.registry.middleware.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    
    console.log(`[Plugin System] Registered middleware: ${config.name}`)
  }

  /**
   * Unregister middleware
   */
  unregisterMiddleware(name: string): void {
    const index = this.registry.middleware.findIndex(m => m.name === name)
    if (index < 0) {
      throw new Error(`Middleware "${name}" is not registered`)
    }

    this.registry.middleware.splice(index, 1)
    console.log(`[Plugin System] Unregistered middleware: ${name}`)
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Array<{ plugin: Plugin; config: PluginConfig }> {
    return Array.from(this.registry.plugins.values())
  }

  /**
   * Get plugins sorted by priority for a specific route
   */
  getPluginsForRoute(route: string): Array<{ plugin: Plugin; config: PluginConfig }> {
    return this.getPlugins()
      .filter(({ config }) => {
        if (!config.enabled) return false
        
        // Check if route matches
        if (config.routes && config.routes.length > 0) {
          const matches = config.routes.some(pattern => this.matchRoute(route, pattern))
          if (!matches) return false
        }
        
        // Check exclusions
        if (config.excludeRoutes && config.excludeRoutes.length > 0) {
          const excluded = config.excludeRoutes.some(pattern => this.matchRoute(route, pattern))
          if (excluded) return false
        }
        
        return true
      })
      .sort((a, b) => (a.config.priority ?? 100) - (b.config.priority ?? 100))
  }

  /**
   * Get all middleware
   */
  getMiddleware(): MiddlewareConfig[] {
    return [...this.registry.middleware]
  }

  /**
   * Get middleware for a specific route
   */
  getMiddlewareForRoute(route: string): MiddlewareConfig[] {
    return this.registry.middleware.filter(config => {
      // Check if route matches
      if (config.routes && config.routes.length > 0) {
        const matches = config.routes.some(pattern => this.matchRoute(route, pattern))
        if (!matches) return false
      }
      
      // Check exclusions
      if (config.excludeRoutes && config.excludeRoutes.length > 0) {
        const excluded = config.excludeRoutes.some(pattern => this.matchRoute(route, pattern))
        if (excluded) return false
      }
      
      return true
    })
  }

  /**
   * Check if a route matches a pattern
   * Supports wildcards: /api/* matches /api/users, /api/posts, etc.
   */
  private matchRoute(route: string, pattern: string): boolean {
    // Exact match
    if (route === pattern) return true
    
    // Wildcard match
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*')
      const regex = new RegExp(`^${regexPattern}$`)
      return regex.test(route)
    }
    
    // Prefix match (pattern ends with /)
    if (pattern.endsWith('/')) {
      return route.startsWith(pattern)
    }
    
    return false
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): { plugin: Plugin; config: PluginConfig } | undefined {
    return this.registry.plugins.get(name)
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.registry.plugins.has(name)
  }

  /**
   * Clear all plugins and middleware
   */
  clear(): void {
    this.registry.plugins.clear()
    this.registry.middleware = []
    console.log('[Plugin System] Cleared all plugins and middleware')
  }
}

// Export singleton instance
export const pluginManager = new PluginManager()
