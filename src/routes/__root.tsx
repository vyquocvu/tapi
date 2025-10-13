import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import '../app.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function Navigation() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <nav>
      <div>
        <Link to="/" activeProps={{ className: 'active' }}>
          Home
        </Link>
        <Link to="/about" activeProps={{ className: 'active' }}>
          About
        </Link>
        {isAuthenticated && (
          <>
            <Link to="/dashboard" activeProps={{ className: 'active' }}>
              Dashboard
            </Link>
            <Link to="/content-type-builder" activeProps={{ className: 'active' }}>
              Content Types
            </Link>
          </>
        )}
      </div>
      <div>
        {isAuthenticated ? (
          <>
            <span style={{ color: 'white', marginRight: '1rem' }}>
              Welcome, {user?.name}
            </span>
            <button 
              onClick={logout} 
              style={{ 
                background: 'transparent', 
                border: '1px solid white',
                padding: '0.3rem 0.8rem',
                fontSize: '0.9rem'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" activeProps={{ className: 'active' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
        <div className="container">
          <Outlet />
        </div>
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
