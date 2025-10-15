/**
 * API Analytics Service
 * Tracks API usage, statistics, and activity logs for the dashboard
 */

export interface APIEndpoint {
  path: string
  method: string
  contentType?: string
  isPublic: boolean
  requiresAuth: boolean
  description: string
}

export interface APIStatistics {
  totalEndpoints: number
  publicEndpoints: number
  privateEndpoints: number
  contentTypeEndpoints: number
}

export interface ActivityLog {
  id: string
  endpoint: string
  method: string
  timestamp: Date
  statusCode: number
  responseTime: number
  contentType?: string
}

/**
 * Get all available API endpoints
 */
export function getAPIEndpoints(): APIEndpoint[] {
  return [
    // Authentication endpoints
    {
      path: '/api/login',
      method: 'POST',
      isPublic: true,
      requiresAuth: false,
      description: 'User authentication - returns JWT token'
    },
    {
      path: '/api/me',
      method: 'GET',
      isPublic: false,
      requiresAuth: true,
      description: 'Get current authenticated user information'
    },
    
    // Content Type Builder endpoints
    {
      path: '/api/content-types',
      method: 'GET',
      isPublic: false,
      requiresAuth: true,
      description: 'Get all content types or specific content type by UID'
    },
    {
      path: '/api/content-types',
      method: 'POST',
      isPublic: false,
      requiresAuth: true,
      description: 'Create a new content type definition'
    },
    {
      path: '/api/content-types',
      method: 'PUT',
      isPublic: false,
      requiresAuth: true,
      description: 'Update an existing content type definition'
    },
    {
      path: '/api/content-types',
      method: 'DELETE',
      isPublic: false,
      requiresAuth: true,
      description: 'Delete a content type definition'
    },
    
    // Content Manager endpoints (Dynamic CRUD)
    {
      path: '/api/content',
      method: 'GET',
      isPublic: false,
      requiresAuth: true,
      description: 'Get all entries or specific entry by ID for any content type'
    },
    {
      path: '/api/content',
      method: 'POST',
      isPublic: false,
      requiresAuth: true,
      description: 'Create a new content entry for any content type'
    },
    {
      path: '/api/content',
      method: 'PUT',
      isPublic: false,
      requiresAuth: true,
      description: 'Update an existing content entry'
    },
    {
      path: '/api/content',
      method: 'DELETE',
      isPublic: false,
      requiresAuth: true,
      description: 'Delete a content entry'
    },
    
    // System endpoints
    {
      path: '/api/health',
      method: 'GET',
      isPublic: true,
      requiresAuth: false,
      description: 'Health check and system status'
    },
    {
      path: '/api/posts',
      method: 'GET',
      isPublic: false,
      requiresAuth: true,
      description: 'Legacy endpoint - Get all published posts'
    }
  ]
}

/**
 * Get API statistics
 */
export function getAPIStatistics(): APIStatistics {
  const endpoints = getAPIEndpoints()
  
  return {
    totalEndpoints: endpoints.length,
    publicEndpoints: endpoints.filter(e => e.isPublic).length,
    privateEndpoints: endpoints.filter(e => !e.isPublic).length,
    contentTypeEndpoints: endpoints.filter(e => 
      e.path.includes('/content-types') || e.path.includes('/content')
    ).length
  }
}

/**
 * Get activity logs (mock data for now - in production this would come from a logging service)
 */
export function getRecentActivityLogs(limit: number = 10): ActivityLog[] {
  // In production, this would fetch from a database or logging service
  // For now, returning mock data
  const now = new Date()
  return [
    {
      id: '1',
      endpoint: '/api/content',
      method: 'GET',
      timestamp: new Date(now.getTime() - 5 * 60000),
      statusCode: 200,
      responseTime: 45,
      contentType: 'api::article.article'
    },
    {
      id: '2',
      endpoint: '/api/content-types',
      method: 'GET',
      timestamp: new Date(now.getTime() - 10 * 60000),
      statusCode: 200,
      responseTime: 23
    },
    {
      id: '3',
      endpoint: '/api/me',
      method: 'GET',
      timestamp: new Date(now.getTime() - 15 * 60000),
      statusCode: 200,
      responseTime: 12
    },
    {
      id: '4',
      endpoint: '/api/content',
      method: 'POST',
      timestamp: new Date(now.getTime() - 20 * 60000),
      statusCode: 201,
      responseTime: 89,
      contentType: 'api::article.article'
    },
    {
      id: '5',
      endpoint: '/api/login',
      method: 'POST',
      timestamp: new Date(now.getTime() - 25 * 60000),
      statusCode: 200,
      responseTime: 156
    }
  ].slice(0, limit)
}

/**
 * Get endpoint documentation grouped by category
 */
export interface EndpointDocumentation {
  category: string
  endpoints: APIEndpoint[]
}

export function getEndpointDocumentation(): EndpointDocumentation[] {
  const endpoints = getAPIEndpoints()
  
  return [
    {
      category: 'Authentication',
      endpoints: endpoints.filter(e => e.path.includes('/login') || e.path.includes('/me'))
    },
    {
      category: 'Content Type Builder',
      endpoints: endpoints.filter(e => e.path.includes('/content-types'))
    },
    {
      category: 'Content Manager (Dynamic CRUD)',
      endpoints: endpoints.filter(e => e.path === '/api/content')
    },
    {
      category: 'System',
      endpoints: endpoints.filter(e => e.path.includes('/health') || e.path.includes('/posts'))
    }
  ]
}
