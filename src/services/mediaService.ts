import { getStorageProvider, MediaFile, UploadOptions } from '../storage/index.js'

/**
 * Media service
 * Provides high-level API for media management
 */
class MediaService {
  private storage = getStorageProvider()

  /**
   * Upload a file
   */
  async uploadFile(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile> {
    try {
      console.log(`[MediaService] Uploading file: ${filename}`)
      const result = await this.storage.upload(file, filename, options)
      console.log(`[MediaService] File uploaded successfully: ${result.id}`)
      return result
    } catch (error) {
      console.error('[MediaService] Error uploading file:', error)
      throw error
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      console.log(`[MediaService] Deleting file: ${fileId}`)
      const result = await this.storage.delete(fileId)
      console.log(`[MediaService] File deleted: ${result}`)
      return result
    } catch (error) {
      console.error('[MediaService] Error deleting file:', error)
      throw error
    }
  }

  /**
   * Get a file's URL
   */
  async getFileUrl(fileId: string): Promise<string> {
    try {
      return await this.storage.getUrl(fileId)
    } catch (error) {
      console.error('[MediaService] Error getting file URL:', error)
      throw error
    }
  }

  /**
   * List all files
   */
  async listFiles(folder?: string): Promise<MediaFile[]> {
    try {
      console.log(`[MediaService] Listing files${folder ? ` in folder: ${folder}` : ''}`)
      const files = await this.storage.list(folder)
      console.log(`[MediaService] Found ${files.length} files`)
      return files
    } catch (error) {
      console.error('[MediaService] Error listing files:', error)
      throw error
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      return await this.storage.exists(fileId)
    } catch (error) {
      console.error('[MediaService] Error checking file existence:', error)
      throw error
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<MediaFile | null> {
    try {
      return await this.storage.getMetadata(fileId)
    } catch (error) {
      console.error('[MediaService] Error getting file metadata:', error)
      throw error
    }
  }

  /**
   * Get storage provider info
   */
  getProviderInfo() {
    return {
      name: this.storage.name,
      provider: process.env.STORAGE_PROVIDER || 'local',
    }
  }
}

// Export a singleton instance
export const mediaService = new MediaService()

// Export named functions for easier importing
export const uploadFile = (file: Buffer, filename: string, options?: UploadOptions) =>
  mediaService.uploadFile(file, filename, options)

export const deleteFile = (fileId: string) => mediaService.deleteFile(fileId)

export const getFileUrl = (fileId: string) => mediaService.getFileUrl(fileId)

export const listFiles = (folder?: string) => mediaService.listFiles(folder)

export const fileExists = (fileId: string) => mediaService.fileExists(fileId)

export const getFileMetadata = (fileId: string) => mediaService.getFileMetadata(fileId)

export const getProviderInfo = () => mediaService.getProviderInfo()
