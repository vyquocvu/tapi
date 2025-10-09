import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

// Mock API endpoint - simulates a server-side API
async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }
  return response.json()
}

// Mock server API endpoint
async function fetchApiHello() {
  // In a real app, this would be a backend API
  // For demo purposes, we're simulating it
  return {
    message: 'Hello from the server API!',
    timestamp: new Date().toISOString(),
    status: 'success',
  }
}

function HomeComponent() {
  const queryClient = useQueryClient()

  // Pre-fetch posts data (simulating loader behavior)
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
  }, [queryClient])

  // Client-side caching with TanStack Query
  const { data: posts, isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  // Fetch from our mock server API
  const { data: apiData } = useQuery({
    queryKey: ['api-hello'],
    queryFn: fetchApiHello,
  })

  return (
    <div>
      <h1>Home Page</h1>
      <p>
        Welcome to the TanStack Start demo! This page demonstrates client-side
        data fetching with TanStack Query for efficient caching and state management.
      </p>

      {apiData && (
        <div className="info-box">
          <h3>Mock Server API Response</h3>
          <p>{apiData.message}</p>
          <p>Timestamp: {new Date(apiData.timestamp).toLocaleString()}</p>
          <p><small>(In production, this would be from /api/hello endpoint)</small></p>
        </div>
      )}

      <h2>Posts (Cached with TanStack Query)</h2>
      
      <button onClick={() => refetch()} style={{ marginBottom: '1rem' }}>
        Refetch Data
      </button>
      
      {isLoading && <div className="loading">Loading posts...</div>}
      
      {error && (
        <div className="error">
          Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {posts && (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="card">
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <h3>💡 TanStack Query Benefits</h3>
        <ul>
          <li>Automatic caching and background refetching</li>
          <li>Stale data is shown while fresh data is fetched</li>
          <li>Deduplication of requests</li>
          <li>Built-in loading and error states</li>
          <li>Easy data refetching with cache invalidation</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>
          <strong>Try it:</strong> Navigate to the About page and back. Notice how the data 
          loads instantly from cache (within the 5-minute stale time).
        </p>
      </div>
    </div>
  )
}
