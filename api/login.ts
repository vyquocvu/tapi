import { createPostHandler } from './_lib/handler.js'
import { loginUser } from '../src/services/authService.js'
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  HTTP_STATUS,
} from './_lib/response.js'

export default createPostHandler(async ({ req, res }) => {
  const credentials = req.body

  if (!credentials || !credentials.email || !credentials.password) {
    console.error('[API /login] Missing credentials:', {
      hasEmail: !!credentials?.email,
      hasPassword: !!credentials?.password,
    })
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Email and password are required')
    )
    return
  }

  console.log('[API /login] Attempting login for:', credentials.email)
  const result = await loginUser(credentials)

  if (result.success) {
    console.log('[API /login] Login successful for:', credentials.email)
    res.status(HTTP_STATUS.OK).json(result)
  } else {
    console.warn('[API /login] Login failed for:', credentials.email, 'Error:', result.error)
    res.status(HTTP_STATUS.UNAUTHORIZED).json(result)
  }
})
