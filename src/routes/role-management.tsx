import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Shield, Plus, Edit, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/role-management')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: RoleManagementComponent,
})

interface Role {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

async function fetchRoles(): Promise<Role[]> {
  const token = sessionStorage.getItem('authToken')
  const response = await fetch('/api/roles', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch roles')
  }

  const data = await response.json()
  return data.data
}

async function createRole(roleData: {
  name: string
  description?: string
}): Promise<Role> {
  const token = sessionStorage.getItem('authToken')
  const response = await fetch('/api/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(roleData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create role')
  }

  const data = await response.json()
  return data.data
}

async function updateRole(
  id: number,
  roleData: Partial<{
    name: string
    description: string
  }>
): Promise<Role> {
  const token = sessionStorage.getItem('authToken')
  const response = await fetch(`/api/roles?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(roleData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update role')
  }

  const data = await response.json()
  return data.data
}

async function deleteRole(id: number): Promise<void> {
  const token = sessionStorage.getItem('authToken')
  const response = await fetch(`/api/roles?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete role')
  }
}

function RoleManagementComponent() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  })

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setShowCreateForm(false)
      resetForm()
      alert('Role created successfully')
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setEditingRole(null)
      resetForm()
      alert('Role updated successfully')
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      alert('Role deleted successfully')
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRole) return

    updateMutation.mutate({ id: editingRole.id, data: formData })
  }

  const startEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
    })
    setShowCreateForm(true)
  }

  const handleDelete = (id: number, roleName: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Role Management
          </h1>
          <p className="text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true)
            setEditingRole(null)
            resetForm()
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </h2>
          <form onSubmit={editingRole ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Editor, Viewer, Admin"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this role"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRole ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingRole(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showCreateForm ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Roles</h2>
          {rolesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !roles || roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No roles found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-left p-3 font-semibold">Created</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{role.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {role.description || <em>No description</em>}
                      </td>
                      <td className="p-3">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(role.id, role.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : ''}
    </div>
  )
}
