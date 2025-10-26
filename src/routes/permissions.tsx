import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Plus, Edit, Trash2, X } from 'lucide-react'
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'
import type { Permission } from '@/services/types'

export const Route = createFileRoute('/permissions')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: PermissionsComponent,
})

interface PermissionFormData {
  name: string
  resource: string
  action: string
  description: string
}

function PermissionsComponent() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    resource: '',
    action: '',
    description: '',
  })

  const { data: permissions, isLoading, error } = useQuery({
    queryKey: queryKeys.permissions.lists(),
    queryFn: fetchPermissions,
  })

  const createMutation = useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() })
      resetForm()
      alert('Permission created successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PermissionFormData> }) =>
      updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() })
      resetForm()
      alert('Permission updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() })
      alert('Permission deleted successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      resource: '',
      action: '',
      description: '',
    })
    setShowForm(false)
    setEditingPermission(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPermission) {
      updateMutation.mutate({
        id: editingPermission.id,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const startEdit = (permission: Permission) => {
    setEditingPermission(permission)
    setFormData({
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = (permission: Permission) => {
    if (
      confirm(
        `Are you sure you want to delete the permission "${permission.name}"? This will affect all roles using this permission.`
      )
    ) {
      deleteMutation.mutate(permission.id)
    }
  }

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

  // Group permissions by resource
  const groupedPermissions = permissions?.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8" />
            Permissions Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage system permissions
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true)
            setEditingPermission(null)
            resetForm()
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Permission
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingPermission ? 'Edit Permission' : 'Create New Permission'}
            </h2>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., content:create"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: resource:action
                </p>
              </div>

              <div>
                <Label htmlFor="resource">Resource *</Label>
                <Input
                  id="resource"
                  type="text"
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  required
                  placeholder="e.g., content, users, roles"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="action">Action *</Label>
                <Input
                  id="action"
                  type="text"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  required
                  placeholder="e.g., create, read, update, delete"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this permission"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingPermission ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {groupedPermissions && Object.keys(groupedPermissions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <Card key={resource} className="p-6">
              <h2 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {resource}
              </h2>
              <div className="space-y-3">
                {perms.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-semibold bg-muted px-2 py-1 rounded">
                          {permission.name}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          ({permission.action})
                        </span>
                      </div>
                      {permission.description && (
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>ID: {permission.id}</span>
                        <span>
                          Created: {new Date(permission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(permission)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(permission)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No permissions found</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Permission
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
