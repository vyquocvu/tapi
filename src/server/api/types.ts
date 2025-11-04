import type { Connect } from 'vite'

export interface RouteContext {
  req: Connect.IncomingMessage
  res: any
  url: URL
}

export type RouteHandler = (context: RouteContext) => Promise<void> | void
