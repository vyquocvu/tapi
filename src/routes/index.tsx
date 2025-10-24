import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Home Page</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Welcome to the TanStack Start demo! This application demonstrates a full-stack 
          setup with TanStack Router for routing and TanStack Query for data management.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>Type-safe routing with TanStack Router</li>
            <li>Efficient data fetching and caching with TanStack Query</li>
            <li>JWT-based authentication</li>
            <li>Protected routes with automatic redirects</li>
            <li>Database integration with Prisma</li>
            <li>Server-side API endpoints</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Login to explore:</strong> Navigate to the login page and use the demo 
            credentials to access the protected dashboard. The dashboard displays posts 
            from the database with real-time data fetching.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Demo credentials:</strong> demo@user.com / password
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
