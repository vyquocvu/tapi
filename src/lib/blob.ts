import { upload } from '@vercel/blob/client'

/**
 * Client helper for direct uploads to Vercel Blob using the official SDK
 */

/**
 * Get upload token from the server
 */
export async function getVercelUploadToken(filename: string) {
  const resp = await fetch(`/api/media?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
  })

  const json = await resp.json()
  if (!json.success) throw new Error(json.error || 'Failed to get upload token')
  return json.data
}

/**
 * Upload file to Vercel Blob using the official client SDK
 * The handleUploadUrl will be called by the SDK to get the upload URL
 */
export async function uploadToVercelBlob(filename: string, file: File | Blob) {
  // Use @vercel/blob/client to upload
  // The SDK will call our handleUploadUrl which returns the token
  const blob = await upload(filename, file, {
    access: 'public',
    handleUploadUrl: `/api/media?filename=${encodeURIComponent(filename)}`,
  })

  return blob
}

/**
 * Legacy method for backward compatibility
 * @deprecated Use uploadToVercelBlob instead
 */
export async function uploadToVercel(uploadUrl: string, headers: Record<string, string>, file: Blob) {
  const resp = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Upload failed: ${resp.status} ${text}`)
  }

  return await resp.json()
}
