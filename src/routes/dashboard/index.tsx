import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth-utils'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => requireAuth('/dashboard'),
  component: DashboardComponent,
})

function DashboardComponent() {
  const { user } = useAuth()

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
