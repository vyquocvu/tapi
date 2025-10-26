import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { UserPlus, Edit, Trash2, Users, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  assignRoleToUser,
  removeRoleFromUser,
  type User,
} from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'

export const Route = createFileRoute('/user-management/')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: UserManagementComponent,
})

function UserManagementComponent() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [managingRolesUser, setManagingRolesUser] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    bio: '',
    isActive: true,
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: fetchUsers,
  })

  const { data: roles } = useQuery({
    queryKey: queryKeys.roles.lists(),
    queryFn: fetchRoles,
  })

  const { data: userWithRoles } = useQuery({
    queryKey: queryKeys.users.detail(managingRolesUser?.id || 0, true),
    queryFn: () => fetchUser(managingRolesUser!.id, true),
    enabled: !!managingRolesUser,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
      setShowCreateForm(false)
      resetForm()
      alert('User created successfully')
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
      setEditingUser(null)
      resetForm()
      alert('User updated successfully')
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
      alert('User deleted successfully')
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      assignRoleToUser(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      removeRoleFromUser(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      bio: '',
      isActive: true,
    })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    const updateData: any = {
      email: formData.email,
      name: formData.name,
      bio: formData.bio,
      isActive: formData.isActive,
    }

    if (formData.password) {
      updateData.password = formData.password
    }

    updateMutation.mutate({ id: editingUser.id, data: updateData })
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      bio: user.bio || '',
      isActive: user.isActive,
    })
    setShowCreateForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id)
    }
  }

  const openRolesDialog = (user: User) => {
    setManagingRolesUser(user)
    setSelectedRoles(new Set()) // Reset selected roles
  }

  const handleSaveRoles = async () => {
    if (!managingRolesUser || !userWithRoles) return

    const currentRoleIds = new Set(userWithRoles.roles?.map((role) => role.id) || [])
    const newRoleIds = selectedRoles

    // Find roles to add and remove
    const toAdd = Array.from(newRoleIds).filter((id) => !currentRoleIds.has(id))
    const toRemove = Array.from(currentRoleIds).filter((id) => !newRoleIds.has(id))

    try {
      // Add new roles
      for (const roleId of toAdd) {
        await assignRoleMutation.mutateAsync({
          userId: managingRolesUser.id,
          roleId,
        })
      }

      // Remove old roles
      for (const roleId of toRemove) {
        await removeRoleMutation.mutateAsync({
          userId: managingRolesUser.id,
          roleId,
        })
      }

      setManagingRolesUser(null)
      setSelectedRoles(new Set())
      alert('User roles updated successfully')
    } catch (error) {
      // Errors are handled by mutation onError
    }
  }

  const toggleRole = (roleId: number) => {
    const newSelected = new Set(selectedRoles)
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId)
    } else {
      newSelected.add(roleId)
    }
    setSelectedRoles(newSelected)
  }

  // Update selected roles when user roles are loaded
  useEffect(() => {
    if (userWithRoles && managingRolesUser) {
      const roleIds = new Set(userWithRoles.roles?.map((role) => role.id) || [])
      setSelectedRoles(roleIds)
    }
  }, [userWithRoles, managingRolesUser])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true)
            setEditingUser(null)
            resetForm()
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">
                Password {editingUser && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                type="text"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingUser(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        {usersLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Created</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRolesDialog(user)}
                          title="Manage Roles"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(user)}
                          disabled={currentUser?.id === user.id}
                          title={currentUser?.id === user.id ? "You cannot edit yourself" : "Edit user"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteMutation.isPending || currentUser?.id === user.id}
                          title={currentUser?.id === user.id ? "You cannot delete yourself" : "Delete user"}
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

      {/* Roles Management Dialog */}
      <Dialog
        open={!!managingRolesUser}
        onOpenChange={(open) => {
          if (!open) {
            setManagingRolesUser(null)
            setSelectedRoles(new Set())
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Roles for {managingRolesUser?.name}</DialogTitle>
            <DialogDescription>
              Select the roles this user should have. Changes will be saved when you click Save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {roles?.map((role) => (
              <div key={role.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedRoles.has(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                <div className="grid gap-1 leading-none">
                  <label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {role.name}
                  </label>
                  {role.description && (
                    <p className="text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setManagingRolesUser(null)
                setSelectedRoles(new Set())
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRoles}
              disabled={assignRoleMutation.isPending || removeRoleMutation.isPending}
            >
              {assignRoleMutation.isPending || removeRoleMutation.isPending ? 'Saving...' : 'Save Roles'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
