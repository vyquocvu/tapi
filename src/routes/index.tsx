import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>
        Welcome to the TanStack Start demo! This application demonstrates a full-stack 
        setup with TanStack Router for routing and TanStack Query for data management.
      </p>

      <div className="info-box">
        <h3>🚀 Features</h3>
        <ul>
          <li>Type-safe routing with TanStack Router</li>
          <li>Efficient data fetching and caching with TanStack Query</li>
          <li>JWT-based authentication</li>
          <li>Protected routes with automatic redirects</li>
          <li>Database integration with Prisma</li>
          <li>Server-side API endpoints</li>
        </ul>
      </div>

      <div className="info-box">
        <h3>💡 Getting Started</h3>
        <p>
          <strong>Login to explore:</strong> Navigate to the login page and use the demo 
          credentials to access the protected dashboard. The dashboard displays posts 
          from the database with real-time data fetching.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <strong>Demo credentials:</strong> demo@user.com / password
        </p>
      </div>
    </div>
  )
}
