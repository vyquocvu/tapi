import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Plus, Edit, Trash2, X, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  fetchContentTypesArray,
} from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'
import type { Permission } from '@/services/types'

export const Route = createFileRoute('/permissions/')({
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
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set())
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())
  const [selectedResourceActions, setSelectedResourceActions] = useState<Map<string, Set<string>>>(new Map())
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
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

  // Fetch content types from Content Type Builder
  const { data: contentTypes } = useQuery({
    queryKey: queryKeys.contentTypes.all,
    queryFn: fetchContentTypesArray,
  })

  // Build resource list from content types and system resources
  const availableResources = useMemo(() => {
    const systemResources = [
      { uid: 'users', displayName: 'Users', description: 'User management' },
      { uid: 'roles', displayName: 'Roles', description: 'Role management' },
      { uid: 'permissions', displayName: 'Permissions', description: 'Permission management' },
      { uid: 'media', displayName: 'Media', description: 'Media/File uploads' },
    ]
    
    // Add content types as resources
    const contentTypeResources = Array.isArray(contentTypes) 
      ? contentTypes.map(ct => ({
          uid: ct.uid,
          displayName: ct.displayName,
          description: ct.description || `${ct.pluralName || ct.displayName} management`
        }))
      : []
    
    return [...systemResources, ...contentTypeResources]
  }, [contentTypes])

  // Common actions
  const commonActions = ['create', 'read', 'update', 'delete']

  const createMutation = useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() })
      resetForm()
      toast.success('Permission created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PermissionFormData> }) =>
      updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() })
      resetForm()
      toast.success('Permission updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() })
      toast.success('Permission deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      resource: '',
      action: '',
      description: '',
    })
    setSelectedActions(new Set())
    setSelectedResourceActions(new Map())
    setExpandedResources(new Set())
    setShowForm(false)
    setEditingPermission(null)
  }

  const toggleAction = (action: string) => {
    const newSelected = new Set(selectedActions)
    if (newSelected.has(action)) {
      newSelected.delete(action)
    } else {
      newSelected.add(action)
    }
    setSelectedActions(newSelected)
  }

  const toggleResourceExpanded = (resourceUid: string) => {
    const newExpanded = new Set(expandedResources)
    if (newExpanded.has(resourceUid)) {
      newExpanded.delete(resourceUid)
    } else {
      newExpanded.add(resourceUid)
    }
    setExpandedResources(newExpanded)
  }

  const toggleResourceAction = (resourceUid: string, action: string) => {
    const newMap = new Map(selectedResourceActions)
    const resourceActions = newMap.get(resourceUid) || new Set()
    
    if (resourceActions.has(action)) {
      resourceActions.delete(action)
    } else {
      resourceActions.add(action)
    }
    
    if (resourceActions.size === 0) {
      newMap.delete(resourceUid)
    } else {
      newMap.set(resourceUid, resourceActions)
    }
    
    setSelectedResourceActions(newMap)
  }

  const toggleSelectAllActions = (resourceUid: string) => {
    const newMap = new Map(selectedResourceActions)
    const resourceActions = newMap.get(resourceUid) || new Set()
    
    // If all actions are selected, deselect all; otherwise, select all
    if (resourceActions.size === commonActions.length) {
      newMap.delete(resourceUid)
    } else {
      newMap.set(resourceUid, new Set(commonActions))
    }
    
    setSelectedResourceActions(newMap)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPermission) {
      // When editing, only update the single permission
      if (selectedActions.size === 0) {
        toast.error('Please select at least one action')
        return
      }
      const action = Array.from(selectedActions)[0]
      const submissionData = {
        ...formData,
        action,
        name: formData.name || `${formData.resource}:${action}`,
      }
      updateMutation.mutate({
        id: editingPermission.id,
        data: submissionData,
      })
    } else {
      // When creating, create permissions for all selected resource-action combinations
      if (selectedResourceActions.size === 0) {
        toast.error('Please select at least one resource and action')
        return
      }

      for (const [resourceUid, actions] of selectedResourceActions.entries()) {
        for (const action of actions) {
          const submissionData = {
            resource: resourceUid,
            action,
            name: `${resourceUid}:${action}`,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resourceUid}`,
          }
          await createMutation.mutateAsync(submissionData)
        }
      }
      
      resetForm()
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
    setSelectedActions(new Set([permission.action]))
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

  // Auto-select first resource if none selected
  const sortedResources = groupedPermissions ? Object.keys(groupedPermissions).sort() : []
  if (!selectedResource && sortedResources.length > 0) {
    setSelectedResource(sortedResources[0])
  }

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
            {!editingPermission ? (
              /* Create Mode: Show collapsible resources with actions */
              (<div>
                <Label className="text-base">Select Resources and Actions *</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Expand resources and check actions to create multiple permissions at once
                </p>
                <div className="space-y-2 border rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  {availableResources.map((resource) => {
                    const isExpanded = expandedResources.has(resource.uid)
                    const selectedActions = selectedResourceActions.get(resource.uid) || new Set()
                    const hasSelections = selectedActions.size > 0
                    
                    return (
                      <div key={resource.uid} className="border rounded-lg">
                        <button
                          type="button"
                          onClick={() => toggleResourceExpanded(resource.uid)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{resource.displayName}</span>
                                {hasSelections && (
                                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                    {selectedActions.size} selected
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{resource.description}</span>
                            </div>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1">
                            <div className="pl-7 space-y-3">
                              {/* Select All checkbox */}
                              <div className="flex items-center space-x-2 pb-2 border-b">
                                <Checkbox
                                  id={`${resource.uid}-select-all`}
                                  checked={selectedActions.size === commonActions.length}
                                  onCheckedChange={() => toggleSelectAllActions(resource.uid)}
                                />
                                <label
                                  htmlFor={`${resource.uid}-select-all`}
                                  className="text-sm font-semibold leading-none cursor-pointer"
                                >
                                  Select All
                                </label>
                              </div>
                              
                              {/* Individual action checkboxes */}
                              <div className="grid grid-cols-2 gap-2">
                                {commonActions.map((action) => (
                                  <div key={action} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${resource.uid}-${action}`}
                                      checked={selectedActions.has(action)}
                                      onCheckedChange={() => toggleResourceAction(resource.uid, action)}
                                    />
                                    <label
                                      htmlFor={`${resource.uid}-${action}`}
                                      className="text-sm font-medium leading-none cursor-pointer capitalize"
                                    >
                                      {action}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>)
            ) : (
              /* Edit Mode: Show resource + action fields */
              (<>
                <div>
                  <Label htmlFor="name">Permission Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Leave empty to auto-generate (resource:action)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Will auto-generate as "resource:action" if left empty
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource">Resource *</Label>
                    <Input
                      id="resource"
                      type="text"
                      value={formData.resource}
                      onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                      required
                      placeholder="e.g., users, roles, content"
                    />
                  </div>

                  <div>
                    <Label>Action *</Label>
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        {commonActions.map((action) => (
                          <div key={action} className="flex items-center space-x-2">
                            <Checkbox
                              id={`action-${action}`}
                              checked={selectedActions.has(action)}
                              onCheckedChange={() => toggleAction(action)}
                            />
                            <label
                              htmlFor={`action-${action}`}
                              className="text-sm font-medium leading-none cursor-pointer capitalize"
                            >
                              {action}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
              </>)
            )}

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
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Resource list */}
          <div className="col-span-3">
            <Card className="p-4 sticky top-20 self-start">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Resources
              </h2>
              <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {Object.keys(groupedPermissions).sort().map((resource) => (
                  <button
                    key={resource}
                    onClick={() => setSelectedResource(resource)}
                    className={`w-full text-left block px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors capitalize ${
                      selectedResource === resource ? 'bg-muted font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{resource}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {groupedPermissions[resource].length}
                      </span>
                    </div>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Right content - Permissions */}
          <div className="col-span-9 space-y-6">
            {selectedResource && groupedPermissions[selectedResource] && (
              <Card key={selectedResource} id={`resource-${selectedResource}`} className="p-6">
                <h2 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {selectedResource}
                </h2>
                <div className="space-y-3">
                  {groupedPermissions[selectedResource].map((permission) => (
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
            )}
          </div>
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
