import { Storage, Bucket } from '@google-cloud/storage'
import { MediaFile, StorageProvider, UploadOptions } from '../types.js'

/**
 * Google Cloud Storage provider
 * Stores files in Google Cloud Storage
 */
export class GCSStorageProvider implements StorageProvider {
  name = 'gcs'
  private storage: Storage
  private bucket: Bucket
  private bucketName: string

  constructor() {
    this.bucketName = process.env.GCS_BUCKET || ''

    if (!this.bucketName) {
      throw new Error('GCS_BUCKET environment variable is required for Google Cloud Storage')
    }

    // Initialize storage client
    // If GCS_KEY_FILE is provided, use it; otherwise fall back to application default credentials
    const keyFilename = process.env.GCS_KEY_FILE
    this.storage = new Storage(
      keyFilename
        ? {
            keyFilename,
            projectId: process.env.GCS_PROJECT_ID,
          }
        : {
            projectId: process.env.GCS_PROJECT_ID,
          }
    )

    this.bucket = this.storage.bucket(this.bucketName)
  }

  /**
   * Generate a unique file key
   */
  private generateFileKey(filename: string, folder?: string): string {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const key = `${timestamp}-${randomStr}-${filename}`
    
    if (folder) {
      return `${folder}/${key}`
    }
    return key
  }

  async upload(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile> {
    const key = this.generateFileKey(filename, options?.folder)
    const fileRef = this.bucket.file(key)

    await fileRef.save(file, {
      contentType: options?.contentType || 'application/octet-stream',
      metadata: {
        metadata: {
          originalName: filename,
        },
      },
    })

    // Make the file publicly accessible
    await fileRef.makePublic()

    const url = `https://storage.googleapis.com/${this.bucketName}/${key}`

    return {
      id: key,
      name: key,
      originalName: filename,
      mimeType: options?.contentType || 'application/octet-stream',
      size: file.length,
      url,
      provider: this.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const fileRef = this.bucket.file(fileId)
      await fileRef.delete()
      return true
    } catch (error) {
      console.error('Error deleting file from GCS:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    const fileRef = this.bucket.file(fileId)
    
    // Generate a signed URL that expires in 1 hour
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    })

    return url
  }

  async list(folder?: string): Promise<MediaFile[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: folder ? `${folder}/` : undefined,
      })

      const mediaFiles: MediaFile[] = []

      for (const file of files) {
        try {
          const metadata = await this.getMetadata(file.name)
          if (metadata) {
            mediaFiles.push(metadata)
          }
        } catch {
          // Fallback if metadata fetch fails
          const [fileMetadata] = await file.getMetadata()
          
          mediaFiles.push({
            id: file.name,
            name: file.name,
            originalName: file.name.split('/').pop() || file.name,
            mimeType: fileMetadata.contentType || 'application/octet-stream',
            size: parseInt(fileMetadata.size || '0', 10),
            url: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
            provider: this.name,
            createdAt: new Date(fileMetadata.timeCreated || Date.now()),
            updatedAt: new Date(fileMetadata.updated || Date.now()),
          })
        }
      }

      return mediaFiles
    } catch (error) {
      console.error('Error listing files from GCS:', error)
      return []
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const fileRef = this.bucket.file(fileId)
      const [exists] = await fileRef.exists()
      return exists
    } catch {
      return false
    }
  }

  async getMetadata(fileId: string): Promise<MediaFile | null> {
    try {
      const fileRef = this.bucket.file(fileId)
      const [metadata] = await fileRef.getMetadata()

      return {
        id: fileId,
        name: fileId,
        originalName: metadata.metadata?.originalName || fileId.split('/').pop() || fileId,
        mimeType: metadata.contentType || 'application/octet-stream',
        size: parseInt(metadata.size || '0', 10),
        url: `https://storage.googleapis.com/${this.bucketName}/${fileId}`,
        provider: this.name,
        createdAt: new Date(metadata.timeCreated || Date.now()),
        updatedAt: new Date(metadata.updated || Date.now()),
      }
    } catch (error) {
      console.error('Error getting metadata from GCS:', error)
      return null
    }
  }
}
