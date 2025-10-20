import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, Image as ImageIcon, File as FileIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { useState, useRef } from 'react'

export const Route = createFileRoute('/media/')({
  beforeLoad: ({ context }) => {
    // @ts-ignore - context has isAuthenticated
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: MediaManagerPage,
})

interface MediaFile {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url: string
  provider: string
  createdAt: string
  updatedAt: string
}

interface ProviderInfo {
  name: string
  provider: string
}

function MediaManagerPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Fetch provider info
  const { data: providerData } = useQuery<{ success: boolean; data: ProviderInfo }>({
    queryKey: ['media-provider'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token')
      const response = await fetch('/api/media?action=provider-info', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch provider info')
      return response.json()
    },
  })

  // Fetch files
  const { data: filesData, isLoading, error, refetch } = useQuery<{ success: boolean; data: MediaFile[] }>({
    queryKey: ['media-files'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token')
      const response = await fetch('/api/media', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch files')
      return response.json()
    },
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = sessionStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      return response.json()
    },
    onSuccess: () => {
      setUploadSuccess('File uploaded successfully!')
      setUploadError(null)
      queryClient.invalidateQueries({ queryKey: ['media-files'] })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setTimeout(() => setUploadSuccess(null), 3000)
    },
    onError: (error: Error) => {
      setUploadError(error.message)
      setUploadSuccess(null)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const token = sessionStorage.getItem('token')
      const response = await fetch(`/api/media?id=${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete file')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] })
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  const handleDelete = (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate(fileId)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')

  const files = filesData?.data || []
  const provider = providerData?.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Manager</h1>
          <p className="text-slate-600 mt-1">
            Upload and manage your media files
            {provider && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Provider: {provider.provider}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Upload section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload size={20} />
            <h2 className="text-lg font-semibold">Upload Files</h2>
          </div>
          
          {uploadSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              {uploadSuccess}
            </Alert>
          )}

          {uploadError && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              {uploadError}
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Files grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Files ({files.length})
        </h2>

        {isLoading && (
          <div className="text-center py-12 text-slate-600">
            Loading files...
          </div>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200 text-red-800">
            Error loading files: {error.message}
          </Alert>
        )}

        {!isLoading && !error && files.length === 0 && (
          <Card className="p-12 text-center text-slate-600">
            <Upload size={48} className="mx-auto mb-4 text-slate-400" />
            <p>No files uploaded yet</p>
            <p className="text-sm mt-2">Upload your first file to get started</p>
          </Card>
        )}

        {!isLoading && !error && files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                {/* Preview */}
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  {isImage(file.mimeType) ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon size={48} className="text-slate-400" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-sm truncate" title={file.originalName}>
                    {file.originalName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <ImageIcon size={14} />
                      <span className="ml-1">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.originalName)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
