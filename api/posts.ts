import { createGetHandler } from './_lib/handler.js'
import { successResponse, HTTP_STATUS } from './_lib/response.js'
import { getAllPosts } from '../src/services/postService.js'

export default createGetHandler(async ({ res }) => {
  console.log('[API /posts] Fetching all posts')
  const posts = await getAllPosts()
  console.log(`[API /posts] Successfully fetched ${posts.length} posts`)
  
  res.status(HTTP_STATUS.OK).json(successResponse(posts))
})
