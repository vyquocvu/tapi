import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
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

  if (!isAuthenticated) {
    return (
      <nav className="bg-slate-800 px-4 py-2 w-full">
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
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:text-blue-400 h-7 text-xs px-2">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-end gap-3">
      <span className="text-sm text-muted-foreground">
        {user?.name}
      </span>
      <Button 
        onClick={logout} 
        variant="outline"
        size="sm"
      >
        Logout
      </Button>
    </div>
  )
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedLayout />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

function AuthenticatedLayout() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <>
        <Navigation />
        <main>
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Outlet />
          </div>
        </main>
      </>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger />
          <Navigation />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
