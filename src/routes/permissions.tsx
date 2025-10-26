import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { fetchPermissions } from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'

export const Route = createFileRoute('/permissions')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: PermissionsComponent,
})

function PermissionsComponent() {
  const { data: permissions, isLoading, error } = useQuery({
    queryKey: queryKeys.permissions.lists(),
    queryFn: fetchPermissions,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p className="text-destructive">Error loading permissions: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Shield className="h-8 w-8" />
          Permissions Management
        </h1>
        <p className="text-muted-foreground">
          View and manage system permissions
        </p>
      </div>

      <div className="grid gap-4">
        {permissions?.map((permission) => (
          <Card key={permission.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {permission.action}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    on {permission.resource}
                  </span>
                </div>
                {permission.description && (
                  <p className="text-sm text-muted-foreground">
                    {permission.description}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>ID: {permission.id}</span>
                  <span>Created: {new Date(permission.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {permissions?.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No permissions found</p>
          </div>
        </Card>
      )}
    </div>
  )
}
