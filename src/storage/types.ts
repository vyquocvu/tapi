/**
 * Media file metadata
 */
export interface MediaFile {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url: string
  provider: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Upload options
 */
export interface UploadOptions {
  filename?: string
  folder?: string
  contentType?: string
}

/**
 * Storage provider interface
 * All storage providers must implement this interface
 */
export interface StorageProvider {
  /**
   * Get the provider name
   */
  name: string

  /**
   * Upload a file to storage
   */
  upload(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile>

  /**
   * Delete a file from storage
   */
  delete(fileId: string): Promise<boolean>

  /**
   * Get a file's public URL
   */
  getUrl(fileId: string): Promise<string>

  /**
   * List all files in storage
   */
  list(folder?: string): Promise<MediaFile[]>

  /**
   * Check if a file exists
   */
  exists(fileId: string): Promise<boolean>

  /**
   * Get file metadata
   */
  getMetadata(fileId: string): Promise<MediaFile | null>
}
