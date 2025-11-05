import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock storage provider
vi.mock('../src/storage/index.js', () => {
  const mockStorageProvider = {
    name: 'MockStorage',
    upload: vi.fn(),
    delete: vi.fn(),
    getUrl: vi.fn(),
    list: vi.fn(),
    exists: vi.fn(),
    getMetadata: vi.fn(),
  }
  
  return {
    getStorageProvider: vi.fn(() => mockStorageProvider),
    mockStorageProvider, // Export for tests
  }
})

// Import after mocks
import {
  uploadFile,
  deleteFile,
  getFileUrl,
  listFiles,
  fileExists,
  getFileMetadata,
  getProviderInfo,
} from '../src/services/mediaService'
import { mockStorageProvider } from '../src/storage/index.js'

describe('mediaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockFile = Buffer.from('test file content')
  const mockMediaFile = {
    id: 'test-file-id',
    filename: 'test.jpg',
    size: 1024,
    mimeType: 'image/jpeg',
    url: 'http://example.com/test.jpg',
  }

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      mockStorageProvider.upload.mockResolvedValue(mockMediaFile)

      const result = await uploadFile(mockFile, 'test.jpg')

      expect(result).toEqual(mockMediaFile)
      expect(mockStorageProvider.upload).toHaveBeenCalledWith(
        mockFile,
        'test.jpg',
        undefined
      )
    })

    it('should pass options to storage provider', async () => {
      const options = { folder: 'uploads', mimeType: 'image/jpeg' }
      mockStorageProvider.upload.mockResolvedValue(mockMediaFile)

      await uploadFile(mockFile, 'test.jpg', options)

      expect(mockStorageProvider.upload).toHaveBeenCalledWith(
        mockFile,
        'test.jpg',
        options
      )
    })

    it('should handle upload errors', async () => {
      const error = new Error('Upload failed')
      mockStorageProvider.upload.mockRejectedValue(error)

      await expect(uploadFile(mockFile, 'test.jpg')).rejects.toThrow('Upload failed')
    })
  })

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      mockStorageProvider.delete.mockResolvedValue(true)

      const result = await deleteFile('test-file-id')

      expect(result).toBe(true)
      expect(mockStorageProvider.delete).toHaveBeenCalledWith('test-file-id')
    })

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed')
      mockStorageProvider.delete.mockRejectedValue(error)

      await expect(deleteFile('test-file-id')).rejects.toThrow('Delete failed')
    })
  })

  describe('getFileUrl', () => {
    it('should return file URL', async () => {
      const url = 'http://example.com/test.jpg'
      mockStorageProvider.getUrl.mockResolvedValue(url)

      const result = await getFileUrl('test-file-id')

      expect(result).toBe(url)
      expect(mockStorageProvider.getUrl).toHaveBeenCalledWith('test-file-id')
    })

    it('should handle getUrl errors', async () => {
      const error = new Error('URL retrieval failed')
      mockStorageProvider.getUrl.mockRejectedValue(error)

      await expect(getFileUrl('test-file-id')).rejects.toThrow('URL retrieval failed')
    })
  })

  describe('listFiles', () => {
    it('should list all files', async () => {
      const mockFiles = [mockMediaFile]
      mockStorageProvider.list.mockResolvedValue(mockFiles)

      const result = await listFiles()

      expect(result).toEqual(mockFiles)
      expect(mockStorageProvider.list).toHaveBeenCalledWith(undefined)
    })

    it('should list files in specific folder', async () => {
      const mockFiles = [mockMediaFile]
      mockStorageProvider.list.mockResolvedValue(mockFiles)

      const result = await listFiles('images')

      expect(result).toEqual(mockFiles)
      expect(mockStorageProvider.list).toHaveBeenCalledWith('images')
    })

    it('should handle list errors', async () => {
      const error = new Error('List failed')
      mockStorageProvider.list.mockRejectedValue(error)

      await expect(listFiles()).rejects.toThrow('List failed')
    })
  })

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockStorageProvider.exists.mockResolvedValue(true)

      const result = await fileExists('test-file-id')

      expect(result).toBe(true)
      expect(mockStorageProvider.exists).toHaveBeenCalledWith('test-file-id')
    })

    it('should return false when file does not exist', async () => {
      mockStorageProvider.exists.mockResolvedValue(false)

      const result = await fileExists('nonexistent-id')

      expect(result).toBe(false)
    })

    it('should handle exists errors', async () => {
      const error = new Error('Exists check failed')
      mockStorageProvider.exists.mockRejectedValue(error)

      await expect(fileExists('test-file-id')).rejects.toThrow('Exists check failed')
    })
  })

  describe('getFileMetadata', () => {
    it('should return file metadata', async () => {
      mockStorageProvider.getMetadata.mockResolvedValue(mockMediaFile)

      const result = await getFileMetadata('test-file-id')

      expect(result).toEqual(mockMediaFile)
      expect(mockStorageProvider.getMetadata).toHaveBeenCalledWith('test-file-id')
    })

    it('should return null when metadata not found', async () => {
      mockStorageProvider.getMetadata.mockResolvedValue(null)

      const result = await getFileMetadata('nonexistent-id')

      expect(result).toBeNull()
    })

    it('should handle getMetadata errors', async () => {
      const error = new Error('Metadata retrieval failed')
      mockStorageProvider.getMetadata.mockRejectedValue(error)

      await expect(getFileMetadata('test-file-id')).rejects.toThrow(
        'Metadata retrieval failed'
      )
    })
  })

  describe('getProviderInfo', () => {
    it('should return provider information', () => {
      const result = getProviderInfo()

      expect(result).toEqual({
        name: 'MockStorage',
        provider: 'local',
      })
    })

    it('should return configured provider from env', () => {
      const originalEnv = process.env.STORAGE_PROVIDER
      process.env.STORAGE_PROVIDER = 's3'

      const result = getProviderInfo()

      expect(result.provider).toBe('s3')

      // Restore original env
      process.env.STORAGE_PROVIDER = originalEnv
    })
  })
})
