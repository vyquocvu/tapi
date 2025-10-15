import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/Sidebar'
import { useState } from 'react'
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
    <nav className="bg-slate-800 px-4 py-2">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="text-white hover:text-blue-400 transition-colors text-sm font-medium [&.active]:text-blue-400"
            activeProps={{ className: 'active' }}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className="text-white hover:text-blue-400 transition-colors text-sm font-medium [&.active]:text-blue-400"
            activeProps={{ className: 'active' }}
          >
            About
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-white text-xs">
                {user?.name}
              </span>
              <Button 
                onClick={logout} 
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white/10 h-7 text-xs px-2"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:text-blue-400 h-7 text-xs px-2">
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedLayout 
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

function AuthenticatedLayout({ 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: { 
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void 
}) {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Navigation />
      <div className="flex">
        {isAuthenticated && (
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
        )}
        <main 
          className={`
            flex-1 transition-all duration-300
            ${isAuthenticated ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
          `}
        >
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  )
}
