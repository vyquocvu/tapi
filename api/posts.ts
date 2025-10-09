import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAllPosts } from '../src/services/postService'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    console.log('[API /posts] Fetching all posts')
    const posts = await getAllPosts()
    console.log(`[API /posts] Successfully fetched ${posts.length} posts`)
    
    return res.status(200).json({
      success: true,
      data: posts,
    })
  } catch (error) {
    console.error('[API /posts] Error fetching posts:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
