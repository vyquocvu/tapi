import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import type { Post } from '../../lib/types'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    // Check if user is authenticated via sessionStorage
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/dashboard',
        },
      })
    }
  },
  component: DashboardComponent,
})

async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('/api/posts', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }
  
  const result = await response.json()
  return result.data || []
}

function DashboardComponent() {
  const { user } = useAuth()
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="info-box">
        <p>Welcome to your protected dashboard, <strong>{user?.name}</strong>!</p>
        <p>Email: {user?.email}</p>
      </div>

      <h2>Posts</h2>
      
      {isLoading && <div className="loading">Loading posts...</div>}
      
      {error && (
        <div className="error">
          Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {posts && posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="card">
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
                By {post.author?.name} • {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <p>No posts available.</p>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h3>🔒 Protected Route</h3>
        <p>
          This route is protected using the <code>beforeLoad</code> hook. 
          If you're not authenticated, you'll be redirected to the login page.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
          <li>JWT-based authentication</li>
          <li>Token stored in sessionStorage</li>
          <li>Automatic redirect for unauthenticated users</li>
          <li>Data fetched from /api/posts endpoint</li>
        </ul>
      </div>
    </div>
  )
}
