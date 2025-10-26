import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Shield, Plus, Edit, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  fetchRoles,
  fetchRole,
  createRole,
  updateRole,
  deleteRole,
  fetchPermissions,
  setRolePermissions,
  type Role,
  type Permission,
} from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'

export const Route = createFileRoute('/role-management/')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: RoleManagementComponent,
})

function RoleManagementComponent() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [managingPermissionsRole, setManagingPermissionsRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: queryKeys.roles.lists(),
    queryFn: fetchRoles,
  })

  const { data: permissions } = useQuery({
    queryKey: queryKeys.permissions.lists(),
    queryFn: fetchPermissions,
  })

  const { data: roleWithPermissions } = useQuery({
    queryKey: queryKeys.roles.detail(managingPermissionsRole?.id || 0, true),
    queryFn: () => fetchRole(managingPermissionsRole!.id, true),
    enabled: !!managingPermissionsRole,
  })

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
      setShowCreateForm(false)
      resetForm()
      toast.success('Role created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
      setEditingRole(null)
      resetForm()
      toast.success('Role updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
      toast.success('Role deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      setRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
      setManagingPermissionsRole(null)
      setSelectedPermissions(new Set())
      toast.success('Permissions updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
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

  const openPermissionsDialog = (role: Role) => {
    setManagingPermissionsRole(role)
  }

  const handleSavePermissions = () => {
    if (!managingPermissionsRole) return
    
    updatePermissionsMutation.mutate({
      roleId: managingPermissionsRole.id,
      permissionIds: Array.from(selectedPermissions),
    })
  }

  const togglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  // Update selected permissions when role permissions are loaded
  useEffect(() => {
    if (roleWithPermissions?.permissions) {
      const permIds = new Set(
        roleWithPermissions.permissions.map((perm) => perm.id)
      )
      setSelectedPermissions(permIds)
    }
  }, [roleWithPermissions])

  // Group permissions by resource
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

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
      {!showCreateForm && (
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
                            onClick={() => openPermissionsDialog(role)}
                            title="Manage Permissions"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
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
      )}
      {/* Permissions Management Dialog */}
      <Dialog
        open={!!managingPermissionsRole}
        onOpenChange={(open) => {
          if (!open) {
            setManagingPermissionsRole(null)
            setSelectedPermissions(new Set())
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions for {managingPermissionsRole?.name}</DialogTitle>
            <DialogDescription>
              Select the permissions this role should have. Changes will be saved when you click Save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {groupedPermissions &&
              Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="space-y-3">
                  <h3 className="font-semibold capitalize text-lg border-b pb-2">
                    {resource}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pl-4">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <div className="grid gap-0.5 leading-none">
                          <label
                            htmlFor={`perm-${perm.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.name}
                          </label>
                          {perm.description && (
                            <p className="text-xs text-muted-foreground">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setManagingPermissionsRole(null)
                setSelectedPermissions(new Set())
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
