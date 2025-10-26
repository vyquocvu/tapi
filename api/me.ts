import { createGetHandler } from './_lib/handler.js'
import { getAuthenticatedUser } from './_lib/auth.js'
import { successResponse, HTTP_STATUS } from './_lib/response.js'

export default createGetHandler(async ({ req, res }) => {
  console.log('[API /me] Authenticating user')
  const user = getAuthenticatedUser(req)

  console.log('[API /me] User authenticated:', user.email)
  res.status(HTTP_STATUS.OK).json(
    successResponse({ user })
  )
}, { requireAuth: true })
