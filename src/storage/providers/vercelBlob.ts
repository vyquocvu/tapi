import { put, del, list, head } from '@vercel/blob'
import { StorageProvider, MediaFile, UploadOptions } from '../types.js'

/**
 * Vercel Blob Storage Provider
 * Uses Vercel Blob SDK to upload and manage files in a Vercel Blob Bucket.
 *
 * Required env vars:
 * - BLOB_READ_WRITE_TOKEN (Vercel Blob token with read/write access)
 */
export class VercelBlobStorageProvider implements StorageProvider {
  name = 'vercel-blob'

  constructor() {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      console.warn('[VercelBlobProvider] BLOB_READ_WRITE_TOKEN not set. Uploads will fail without a token.')
    }
  }

  async upload(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile> {
    try {
      // Use Vercel Blob SDK to upload
      const pathname = options?.folder ? `${options.folder}/${filename}` : filename
      
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: options?.contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      const media: MediaFile = {
        id: blob.pathname,
        name: filename,
        originalName: filename,
        mimeType: options?.contentType || (blob as any).contentType || 'application/octet-stream',
        size: file.length,
        url: blob.url,
        provider: this.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return media
    } catch (error) {
      console.error('[VercelBlobProvider] Upload failed:', error)
      throw error
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      await del(fileId, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      return true
    } catch (error) {
      console.error('[VercelBlobProvider] Delete failed:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    // Vercel Blob URLs are the pathname; we need to construct the full URL
    // In practice, the fileId should already be a full URL from the upload
    return fileId
  }

  async list(folder?: string): Promise<MediaFile[]> {
    try {
      const result = await list({
        prefix: folder,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return result.blobs.map((blob) => ({
        id: blob.pathname,
        name: blob.pathname.split('/').pop() || blob.pathname,
        originalName: blob.pathname.split('/').pop() || blob.pathname,
        mimeType: (blob as any).contentType || 'application/octet-stream',
        size: blob.size,
        url: blob.url,
        provider: this.name,
        createdAt: new Date(blob.uploadedAt),
        updatedAt: new Date(blob.uploadedAt),
      }))
    } catch (error) {
      console.error('[VercelBlobProvider] List failed:', error)
      throw error
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const result = await head(fileId, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      return result !== null
    } catch (error) {
      return false
    }
  }

  async getMetadata(fileId: string): Promise<MediaFile | null> {
    try {
      const blob = await head(fileId, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      if (!blob) return null

      return {
        id: blob.pathname,
        name: blob.pathname.split('/').pop() || blob.pathname,
        originalName: blob.pathname.split('/').pop() || blob.pathname,
        mimeType: blob.contentType || 'application/octet-stream',
        size: blob.size,
        url: blob.url,
        provider: this.name,
        createdAt: new Date(blob.uploadedAt),
        updatedAt: new Date(blob.uploadedAt),
      }
    } catch (error) {
      console.error('[VercelBlobProvider] Get metadata failed:', error)
      return null
    }
  }
}

/**
 * Generate a direct upload URL for client-side uploads using Vercel Blob SDK.
 * This creates a client upload token that can be used from the browser.
 */
export async function generateVercelUploadUrl(filename: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  }

  // Return the token for client-side usage with @vercel/blob client
  // The client will use this token to upload directly to Vercel Blob
  return {
    token,
    pathname: filename,
  }
}
