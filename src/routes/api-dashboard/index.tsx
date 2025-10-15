import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { 
  APIStatistics, 
  ActivityLog,
  EndpointDocumentation 
} from '../../services/apiAnalyticsService'
import type { EndpointConfig } from '../../services/apiEndpointConfigService'

export const Route = createFileRoute('/api-dashboard/')({
  beforeLoad: async () => {
    // Check if user is authenticated
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/api-dashboard',
        },
      })
    }
  },
  component: APIDashboardComponent,
})

// Fetch functions
async function fetchDashboardOverview() {
  const response = await fetch('/api/api-dashboard', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  
  const result = await response.json()
  return result.data
}

async function fetchEndpointDocumentation() {
  const response = await fetch('/api/api-dashboard?action=documentation', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch documentation')
  }
  
  const result = await response.json()
  return result.data as EndpointDocumentation[]
}

async function fetchEndpointConfigs() {
  const response = await fetch('/api/api-dashboard?action=configs', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch endpoint configs')
  }
  
  const result = await response.json()
  return result.data as EndpointConfig[]
}

async function generateContentTypeDocumentation(contentType: string) {
  const response = await fetch(
    `/api/api-dashboard?action=generate-docs&contentType=${encodeURIComponent(contentType)}`,
    {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to generate documentation')
  }
  
  const result = await response.json()
  return result.data.markdown
}

function APIDashboardComponent() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'endpoints' | 'content-types'>('overview')
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [generatedDocs, setGeneratedDocs] = useState<string | null>(null)

  // Fetch dashboard data
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['api-dashboard-overview'],
    queryFn: fetchDashboardOverview,
  })

  const { data: documentation, isLoading: docsLoading } = useQuery({
    queryKey: ['api-documentation'],
    queryFn: fetchEndpointDocumentation,
    enabled: selectedTab === 'endpoints',
  })

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['endpoint-configs'],
    queryFn: fetchEndpointConfigs,
    enabled: selectedTab === 'content-types',
  })

  const statistics: APIStatistics | undefined = overview?.statistics
  const recentActivity: ActivityLog[] = overview?.recentActivity || []

  // Generate documentation mutation
  const generateDocsMutation = useMutation({
    mutationFn: generateContentTypeDocumentation,
    onSuccess: (docs) => {
      setGeneratedDocs(docs)
    },
  })

  const handleGenerateDocs = (contentType: string) => {
    setSelectedContentType(contentType)
    generateDocsMutation.mutate(contentType)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">API Controller Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor your REST API endpoints based on Content Type Builder
        </p>
      </div>

      {/* Error Alert */}
      {overviewError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading dashboard: {overviewError instanceof Error ? overviewError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('endpoints')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'endpoints'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            API Endpoints
          </button>
          <button
            onClick={() => setSelectedTab('content-types')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'content-types'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Content Type APIs
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalEndpoints}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Public Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {statistics.publicEndpoints}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Private Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {statistics.privateEndpoints}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Content Type APIs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {statistics.contentTypeEndpoints}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent API Activity</CardTitle>
              <CardDescription>Latest API endpoint requests and responses</CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <p className="text-center text-muted-foreground">Loading activity...</p>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{log.method}</span>
                          <span className="text-sm text-muted-foreground">{log.endpoint}</span>
                          {log.contentType && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {log.contentType}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold ${
                            log.statusCode >= 200 && log.statusCode < 300
                              ? 'text-green-600'
                              : log.statusCode >= 400
                              ? 'text-red-600'
                              : 'text-orange-600'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                        <span className="text-sm text-muted-foreground">{log.responseTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>View all API endpoints with their methods and access levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Monitor API usage statistics and activity logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Auto-generate API documentation from Content Type definitions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Manage endpoint visibility (public/private access)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>View content type schemas and available operations</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Endpoints Tab */}
      {selectedTab === 'endpoints' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Documentation</CardTitle>
              <CardDescription>
                Complete list of all available API endpoints grouped by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <p className="text-center text-muted-foreground">Loading documentation...</p>
              ) : documentation ? (
                <div className="space-y-6">
                  {documentation.map((category) => (
                    <div key={category.category} className="space-y-3">
                      <h3 className="text-xl font-semibold border-b pb-2">
                        {category.category}
                      </h3>
                      <div className="space-y-2">
                        {category.endpoints.map((endpoint, idx) => (
                          <div
                            key={`${endpoint.path}-${endpoint.method}-${idx}`}
                            className="p-4 rounded-lg border bg-card"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`font-mono text-sm font-bold px-2 py-1 rounded ${
                                    endpoint.method === 'GET'
                                      ? 'bg-blue-100 text-blue-800'
                                      : endpoint.method === 'POST'
                                      ? 'bg-green-100 text-green-800'
                                      : endpoint.method === 'PUT'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {endpoint.method}
                                </span>
                                <code className="text-sm">{endpoint.path}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                {endpoint.isPublic ? (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Public
                                  </span>
                                ) : (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    Private
                                  </span>
                                )}
                                {endpoint.requiresAuth && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    🔒 Auth Required
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No documentation available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Type APIs Tab */}
      {selectedTab === 'content-types' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Type API Configuration</CardTitle>
              <CardDescription>
                Manage API endpoints for your dynamically created content types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <p className="text-center text-muted-foreground">Loading configurations...</p>
              ) : configs && configs.length > 0 ? (
                <div className="space-y-3">
                  {configs.map((config) => (
                    <div key={config.uid} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{config.uid}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {config.isPublic ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Public
                            </span>
                          ) : (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {config.path}
                        </code>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Rate limit: {config.rateLimit}/min
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleGenerateDocs(config.uid)}
                          disabled={generateDocsMutation.isPending}
                          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                          {generateDocsMutation.isPending && selectedContentType === config.uid
                            ? 'Generating...'
                            : 'Generate Docs'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No content types found</p>
                  <p className="text-sm text-muted-foreground">
                    Create content types in the Content Type Builder to see their API endpoints here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Documentation */}
          {generatedDocs && (
            <Card>
              <CardHeader>
                <CardTitle>Generated API Documentation</CardTitle>
                <CardDescription>
                  Documentation for {selectedContentType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {generatedDocs}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
