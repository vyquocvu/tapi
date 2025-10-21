import fs from 'fs/promises'
import path from 'path'
import { MediaFile, StorageProvider, UploadOptions } from '../types.js'

/**
 * Local filesystem storage provider
 * Stores files in the local filesystem
 */
export class LocalStorageProvider implements StorageProvider {
  name = 'local'
  private uploadDir: string
  private baseUrl: string

  constructor() {
    // Use environment variable or default to ./uploads
    this.uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    this.baseUrl = process.env.LOCAL_BASE_URL || 'http://localhost:5173'
  }

  /**
   * Initialize the upload directory if it doesn't exist
   */
  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Generate a unique file ID
   */
  private generateFileId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Get the full file path
   */
  private getFilePath(fileId: string, folder?: string): string {
    if (folder) {
      return path.join(this.uploadDir, folder, fileId)
    }
    return path.join(this.uploadDir, fileId)
  }

  /**
   * Get metadata file path
   */
  private getMetadataPath(fileId: string): string {
    return path.join(this.uploadDir, `${fileId}.meta.json`)
  }

  async upload(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile> {
    await this.ensureUploadDir()

    const fileId = this.generateFileId()
    const extension = path.extname(filename)
    const storedFilename = `${fileId}${extension}`
    const filePath = this.getFilePath(storedFilename, options?.folder)

    // Create folder if specified
    if (options?.folder) {
      const folderPath = path.join(this.uploadDir, options.folder)
      await fs.mkdir(folderPath, { recursive: true })
    }

    // Write file
    await fs.writeFile(filePath, file)

    // Create metadata
    const metadata: MediaFile = {
      id: storedFilename,
      name: storedFilename,
      originalName: filename,
      mimeType: options?.contentType || 'application/octet-stream',
      size: file.length,
      url: `${this.baseUrl}/uploads/${options?.folder ? options.folder + '/' : ''}${storedFilename}`,
      provider: this.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save metadata
    await fs.writeFile(this.getMetadataPath(storedFilename), JSON.stringify(metadata, null, 2))

    return metadata
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadata(fileId)
      if (!metadata) return false

      const filePath = this.getFilePath(fileId)
      await fs.unlink(filePath)
      
      // Delete metadata
      try {
        await fs.unlink(this.getMetadataPath(fileId))
      } catch {
        // Ignore if metadata doesn't exist
      }

      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  async getUrl(fileId: string): Promise<string> {
    const metadata = await this.getMetadata(fileId)
    if (!metadata) {
      throw new Error(`File not found: ${fileId}`)
    }
    return metadata.url
  }

  async list(folder?: string): Promise<MediaFile[]> {
    await this.ensureUploadDir()

    const searchDir = folder ? path.join(this.uploadDir, folder) : this.uploadDir
    
    try {
      const files = await fs.readdir(searchDir)
      const mediaFiles: MediaFile[] = []

      for (const file of files) {
        // Skip metadata files
        if (file.endsWith('.meta.json')) continue

        try {
          const metadata = await this.getMetadata(file)
          if (metadata) {
            mediaFiles.push(metadata)
          }
        } catch {
          // If no metadata, create basic metadata
          const filePath = path.join(searchDir, file)
          const stats = await fs.stat(filePath)
          
          mediaFiles.push({
            id: file,
            name: file,
            originalName: file,
            mimeType: 'application/octet-stream',
            size: stats.size,
            url: `${this.baseUrl}/uploads/${folder ? folder + '/' : ''}${file}`,
            provider: this.name,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
          })
        }
      }

      return mediaFiles
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      await fs.access(this.getFilePath(fileId))
      return true
    } catch {
      return false
    }
  }

  async getMetadata(fileId: string): Promise<MediaFile | null> {
    try {
      const metadataPath = this.getMetadataPath(fileId)
      const metadataContent = await fs.readFile(metadataPath, 'utf-8')
      return JSON.parse(metadataContent)
    } catch {
      return null
    }
  }
}
