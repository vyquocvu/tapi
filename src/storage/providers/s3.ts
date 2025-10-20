import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { MediaFile, StorageProvider, UploadOptions } from '../types.js'

/**
 * AWS S3 storage provider
 * Stores files in Amazon S3
 */
export class S3StorageProvider implements StorageProvider {
  name = 's3'
  private client: S3Client
  private bucket: string
  private region: string

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.bucket = process.env.AWS_S3_BUCKET || ''

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required for S3 storage')
    }

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
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

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: {
        originalName: filename,
      },
    })

    await this.client.send(command)

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`

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
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileId,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    // Generate a presigned URL that expires in 1 hour
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileId,
    })

    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 })
    return url
  }

  async list(folder?: string): Promise<MediaFile[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: folder ? `${folder}/` : undefined,
      })

      const response = await this.client.send(command)
      const files: MediaFile[] = []

      if (response.Contents) {
        for (const object of response.Contents) {
          if (!object.Key) continue

          try {
            const metadata = await this.getMetadata(object.Key)
            if (metadata) {
              files.push(metadata)
            }
          } catch {
            // Fallback if metadata fetch fails
            files.push({
              id: object.Key,
              name: object.Key,
              originalName: object.Key.split('/').pop() || object.Key,
              mimeType: 'application/octet-stream',
              size: object.Size || 0,
              url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${object.Key}`,
              provider: this.name,
              createdAt: object.LastModified || new Date(),
              updatedAt: object.LastModified || new Date(),
            })
          }
        }
      }

      return files
    } catch (error) {
      console.error('Error listing files from S3:', error)
      return []
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileId,
      })

      await this.client.send(command)
      return true
    } catch {
      return false
    }
  }

  async getMetadata(fileId: string): Promise<MediaFile | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileId,
      })

      const response = await this.client.send(command)

      return {
        id: fileId,
        name: fileId,
        originalName: response.Metadata?.originalName || fileId.split('/').pop() || fileId,
        mimeType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0,
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileId}`,
        provider: this.name,
        createdAt: response.LastModified || new Date(),
        updatedAt: response.LastModified || new Date(),
      }
    } catch (error) {
      console.error('Error getting metadata from S3:', error)
      return null
    }
  }
}
