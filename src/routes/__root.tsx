import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
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
    <nav className="bg-slate-800 px-8 py-4 mb-8">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="text-white hover:text-blue-400 transition-colors font-medium [&.active]:text-blue-400 [&.active]:border-b-2 [&.active]:border-blue-400"
            activeProps={{ className: 'active' }}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className="text-white hover:text-blue-400 transition-colors font-medium [&.active]:text-blue-400 [&.active]:border-b-2 [&.active]:border-blue-400"
            activeProps={{ className: 'active' }}
          >
            About
          </Link>
          {isAuthenticated && (
            <>
              <Link 
                to="/dashboard" 
                className="text-white hover:text-blue-400 transition-colors font-medium [&.active]:text-blue-400 [&.active]:border-b-2 [&.active]:border-blue-400"
                activeProps={{ className: 'active' }}
              >
                Dashboard
              </Link>
              <Link 
                to="/content-type-builder" 
                className="text-white hover:text-blue-400 transition-colors font-medium [&.active]:text-blue-400 [&.active]:border-b-2 [&.active]:border-blue-400"
                activeProps={{ className: 'active' }}
              >
                Content Types
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-white text-sm">
                Welcome, {user?.name}
              </span>
              <Button 
                onClick={logout} 
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white/10"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:text-blue-400">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
        <div className="container max-w-7xl mx-auto px-8">
          <Outlet />
        </div>
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
