import { StorageProvider } from './types.js'
import { LocalStorageProvider } from './providers/local.js'
import { S3StorageProvider } from './providers/s3.js'
import { GCSStorageProvider } from './providers/gcs.js'

/**
 * Storage provider factory
 * Returns the appropriate storage provider based on environment configuration
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local'

  switch (provider.toLowerCase()) {
    case 's3':
      return new S3StorageProvider()
    case 'gcs':
    case 'google':
      return new GCSStorageProvider()
    case 'local':
    default:
      return new LocalStorageProvider()
  }
}

export * from './types.js'
export { LocalStorageProvider } from './providers/local.js'
export { S3StorageProvider } from './providers/s3.js'
export { GCSStorageProvider } from './providers/gcs.js'
