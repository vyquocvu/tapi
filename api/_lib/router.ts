import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { HandlerContext } from './handler.js'

type RouteHandler = (context: HandlerContext) => Promise<void> | void

interface Route {
  method: string
  path?: string | RegExp
  handler: RouteHandler
}

export class Router {
  private routes: Route[] = []

  get(handler: RouteHandler): this
  get(path: string | RegExp, handler: RouteHandler): this
  get(pathOrHandler: string | RegExp | RouteHandler, handler?: RouteHandler): this {
    if (typeof pathOrHandler === 'function') {
      this.routes.push({ method: 'GET', handler: pathOrHandler })
    } else {
      this.routes.push({ method: 'GET', path: pathOrHandler, handler: handler! })
    }
    return this
  }

  post(handler: RouteHandler): this
  post(path: string | RegExp, handler: RouteHandler): this
  post(pathOrHandler: string | RegExp | RouteHandler, handler?: RouteHandler): this {
    if (typeof pathOrHandler === 'function') {
      this.routes.push({ method: 'POST', handler: pathOrHandler })
    } else {
      this.routes.push({ method: 'POST', path: pathOrHandler, handler: handler! })
    }
    return this
  }

  put(handler: RouteHandler): this
  put(path: string | RegExp, handler: RouteHandler): this
  put(pathOrHandler: string | RegExp | RouteHandler, handler?: RouteHandler): this {
    if (typeof pathOrHandler === 'function') {
      this.routes.push({ method: 'PUT', handler: pathOrHandler })
    } else {
      this.routes.push({ method: 'PUT', path: pathOrHandler, handler: handler! })
    }
    return this
  }

  delete(handler: RouteHandler): this
  delete(path: string | RegExp, handler: RouteHandler): this
  delete(pathOrHandler: string | RegExp | RouteHandler, handler?: RouteHandler): this {
    if (typeof pathOrHandler === 'function') {
      this.routes.push({ method: 'DELETE', handler: pathOrHandler })
    } else {
      this.routes.push({ method: 'DELETE', path: pathOrHandler, handler: handler! })
    }
    return this
  }

  patch(handler: RouteHandler): this
  patch(path: string | RegExp, handler: RouteHandler): this
  patch(pathOrHandler: string | RegExp | RouteHandler, handler?: RouteHandler): this {
    if (typeof pathOrHandler === 'function') {
      this.routes.push({ method: 'PATCH', handler: pathOrHandler })
    } else {
      this.routes.push({ method: 'PATCH', path: pathOrHandler, handler: handler! })
    }
    return this
  }

  async handle(context: HandlerContext): Promise<boolean> {
    const { req } = context

    for (const route of this.routes) {
      // Check method match
      if (route.method !== req.method) {
        continue
      }

      // Check path match if specified
      if (route.path) {
        const url = req.url || ''
        const matches = typeof route.path === 'string'
          ? url.includes(route.path)
          : route.path.test(url)
        
        if (!matches) {
          continue
        }
      }

      // Execute handler
      await route.handler(context)
      return true
    }

    return false
  }
}

export const createRouter = () => new Router()
