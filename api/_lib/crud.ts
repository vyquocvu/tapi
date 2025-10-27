import type { HandlerContext } from './handler.js'
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  HTTP_STATUS,
} from './response.js'

/**
 * CRUD service interface
 */
export interface CrudService<T = any> {
  getAll: (options?: any) => Promise<T[]>
  getById: (id: number, options?: any) => Promise<T | null>
  create: (data: any) => Promise<T>
  update: (id: number, data: any) => Promise<T>
  delete: (id: number) => Promise<void>
}

/**
 * CRUD handler configuration
 */
export interface CrudHandlerConfig {
  service: CrudService
  resourceName: string
  /** Custom validation for create/update */
  validate?: (data: any) => string | null
  /** Transform data before create/update */
  transform?: (data: any) => any
  /** Include relations parameter name */
  includeParam?: string
  /** Custom list query parameters */
  listParams?: string[]
}

/**
 * Handle list/get operations
 */
export async function handleRead(ctx: HandlerContext, config: CrudHandlerConfig): Promise<void> {
  const { res, params } = ctx
  const { service, resourceName, includeParam } = config

  // Get by ID
  if (params.id) {
    const id = parseInt(params.id as string)
    
    if (isNaN(id)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        badRequestResponse('Invalid ID format')
      )
      return
    }

    const options = includeParam && params[includeParam] === 'true' ? { [includeParam]: true } : {}
    const item = await service.getById(id, options)

    if (!item) {
      res.status(HTTP_STATUS.NOT_FOUND).json(
        notFoundResponse(resourceName)
      )
      return
    }

    res.status(HTTP_STATUS.OK).json(successResponse(item))
    return
  }

  // List all
  const listOptions: any = {}
  if (config.listParams) {
    config.listParams.forEach(param => {
      if (params[param] !== undefined) {
        listOptions[param] = params[param] === 'true' ? true : params[param]
      }
    })
  }

  const items = await service.getAll(listOptions)
  res.status(HTTP_STATUS.OK).json(successResponse(items))
}

/**
 * Handle create operation
 */
export async function handleCreate(ctx: HandlerContext, config: CrudHandlerConfig): Promise<void> {
  const { req, res } = ctx
  const { service, validate, transform } = config

  let data = req.body

  // Validate
  if (validate) {
    const error = validate(data)
    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        badRequestResponse(error)
      )
      return
    }
  }

  // Transform
  if (transform) {
    data = transform(data)
  }

  const item = await service.create(data)
  res.status(HTTP_STATUS.CREATED).json(successResponse(item))
}

/**
 * Handle update operation
 */
export async function handleUpdate(ctx: HandlerContext, config: CrudHandlerConfig, id: number): Promise<void> {
  const { req, res } = ctx
  const { service, resourceName, validate, transform } = config

  let data = req.body

  // Validate
  if (validate) {
    const error = validate(data)
    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        badRequestResponse(error)
      )
      return
    }
  }

  // Transform
  if (transform) {
    data = transform(data)
  }

  const item = await service.update(id, data)
  res.status(HTTP_STATUS.OK).json(successResponse(item))
}

/**
 * Handle delete operation
 */
export async function handleDelete(ctx: HandlerContext, config: CrudHandlerConfig, id: number): Promise<void> {
  const { res } = ctx
  const { service } = config

  await service.delete(id)
  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Deleted successfully' }))
}

/**
 * Create a standard CRUD handler
 */
export async function handleCrud(ctx: HandlerContext, config: CrudHandlerConfig): Promise<void> {
  const { req, params } = ctx

  const id = params.id ? parseInt(params.id as string) : null

  switch (req.method) {
    case 'GET':
      await handleRead(ctx, config)
      break

    case 'POST':
      await handleCreate(ctx, config)
      break

    case 'PUT':
    case 'PATCH':
      if (!id || isNaN(id)) {
        ctx.res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('ID is required for update')
        )
        return
      }
      await handleUpdate(ctx, config, id)
      break

    case 'DELETE':
      if (!id || isNaN(id)) {
        ctx.res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('ID is required for delete')
        )
        return
      }
      await handleDelete(ctx, config, id)
      break

    default:
      // Unreachable if handler methods are configured correctly
      break
  }
}
