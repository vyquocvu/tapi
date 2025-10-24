import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import type { Post } from '../../lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { requireAuth, fetchJSON } from '@/lib/auth-utils'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => requireAuth('/dashboard'),
  component: DashboardComponent,
})

async function fetchPosts(): Promise<Post[]> {
  return fetchJSON<Post[]>('/api/posts')
}

function DashboardComponent() {
  const { user } = useAuth()
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-lg">
            Welcome to your protected dashboard, <strong>{user?.name}</strong>!
          </p>
          <p className="text-muted-foreground mt-2">Email: {user?.email}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Posts</h2>
        
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading posts...</p>
            </CardContent>
          </Card>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    By {post.author?.name} • {new Date(post.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{post.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-muted-foreground">No posts available.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔒 Protected Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This route is protected using the <code className="px-1 py-0.5 rounded bg-muted text-foreground">beforeLoad</code> hook. 
            If you're not authenticated, you'll be redirected to the login page.
          </p>
          <ul className="space-y-2 text-muted-foreground ml-6 list-disc">
            <li>JWT-based authentication</li>
            <li>Token stored in sessionStorage</li>
            <li>Automatic redirect for unauthenticated users</li>
            <li>Data fetched from /api/posts endpoint</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
