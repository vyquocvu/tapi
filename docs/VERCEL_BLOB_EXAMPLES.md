/**
 * Example: Using Vercel Blob Storage
 * 
 * This example shows how to use the Vercel Blob integration
 * for both server-side and client-side file uploads.
 */

// ============================================
// SERVER-SIDE USAGE (Node.js/API Routes)
// ============================================

import { mediaService } from '@/services/mediaService'

// Example 1: Upload a file from server
export async function serverUploadExample() {
  // Assuming you have file data as a Buffer
  const fileBuffer = Buffer.from('Hello, Vercel Blob!')
  
  const result = await mediaService.uploadFile(
    fileBuffer,
    'example.txt',
    {
      contentType: 'text/plain',
      folder: 'documents',
    }
  )
  
  console.log('File uploaded to:', result.url)
  return result
}

// Example 2: List files
export async function listFilesExample() {
  // List all files
  const allFiles = await mediaService.listFiles()
  
  // List files in a specific folder
  const documentsFiles = await mediaService.listFiles('documents')
  
  return { allFiles, documentsFiles }
}

// Example 3: Delete a file
export async function deleteFileExample(fileId: string) {
  const success = await mediaService.deleteFile(fileId)
  console.log('File deleted:', success)
  return success
}

// ============================================
// CLIENT-SIDE USAGE (Browser/React)
// ============================================

import { uploadToVercelBlob } from '@/lib/blob'

// Example 4: Upload from file input (React component)
export function FileUploadComponent() {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      console.log('Uploading file:', file.name)
      
      const blob = await uploadToVercelBlob(file.name, file)
      
      console.log('Upload successful!')
      console.log('File URL:', blob.url)
      console.log('File size:', blob.size)
      
      // You can now save blob.url to your database or use it directly
      
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  
  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
    </div>
  )
}

// Example 5: Upload with drag and drop
export function DragDropUpload() {
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    
    const file = event.dataTransfer.files[0]
    if (!file) return
    
    try {
      const blob = await uploadToVercelBlob(file.name, file)
      console.log('Uploaded via drag-drop:', blob.url)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }
  
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: '2px dashed #ccc',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      Drop files here to upload
    </div>
  )
}

// Example 6: Upload image with preview
export function ImageUploadWithPreview() {
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [uploadedUrl, setUploadedUrl] = React.useState<string>('')
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    // Upload to Vercel Blob
    try {
      const blob = await uploadToVercelBlob(file.name, file)
      setUploadedUrl(blob.url)
      console.log('Image uploaded:', blob.url)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  
  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      
      {previewUrl && (
        <div>
          <h3>Preview:</h3>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '300px' }} />
        </div>
      )}
      
      {uploadedUrl && (
        <div>
          <h3>Uploaded URL:</h3>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  )
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * Required environment variables:
 * 
 * .env file:
 * ```
 * STORAGE_PROVIDER=vercel
 * BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
 * ```
 * 
 * Get your token from: https://vercel.com/dashboard/stores
 */
