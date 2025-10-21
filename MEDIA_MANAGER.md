# Media Manager

The Media Manager is a comprehensive file management system that supports multiple storage providers including local filesystem, Amazon S3, and Google Cloud Storage.

## Features

- 📤 **File Upload** - Upload files with drag-and-drop support
- 🗑️ **File Deletion** - Delete files with confirmation
- 👁️ **File Preview** - Preview images and view file details
- 📊 **File Information** - Display file size, type, and upload date
- 🔄 **Multiple Storage Providers** - Seamlessly switch between storage backends
- 🔒 **Secure** - Protected routes requiring authentication
- 🎨 **Modern UI** - Clean interface with shadcn/ui components

## Storage Providers

### Local Filesystem (Default)

Stores files in the local filesystem. Ideal for development and small deployments.

**Environment Variables:**
```bash
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads          # Directory for storing files
LOCAL_BASE_URL=http://localhost:5173 # Base URL for serving files
```

**Pros:**
- No external dependencies
- Fast and simple
- No additional costs

**Cons:**
- Not scalable for multi-server deployments
- Limited to single server instance
- No built-in CDN support

### Amazon S3

Stores files in Amazon S3 buckets. Ideal for production deployments.

**Environment Variables:**
```bash
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=your-bucket-name
```

**Setup:**

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 access
3. Generate access credentials
4. Configure environment variables

**Required IAM Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

**Pros:**
- Highly scalable
- Built-in CDN with CloudFront
- Reliable and durable
- Pay-as-you-go pricing

**Cons:**
- Requires AWS account
- Additional costs
- More complex setup

### Google Cloud Storage

Stores files in Google Cloud Storage buckets. Alternative to S3 with similar features.

**Environment Variables:**
```bash
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_KEY_FILE=path/to/service-account-key.json  # Optional, uses ADC if not provided
```

**Setup:**

1. Create a GCS bucket in Google Cloud Console
2. Create a service account with Storage Admin role
3. Download the service account key JSON file
4. Configure environment variables

**Required Permissions:**
- `storage.objects.create`
- `storage.objects.delete`
- `storage.objects.get`
- `storage.objects.list`

**Pros:**
- Highly scalable
- Integration with Google Cloud ecosystem
- Competitive pricing
- Global CDN available

**Cons:**
- Requires Google Cloud account
- Additional costs
- Setup complexity

## Usage

### Accessing the Media Manager

Navigate to `/media` in your application. You must be logged in to access the media manager.

### Uploading Files

1. Click the "Choose File" button or use the file input
2. Select a file from your device
3. The file will be uploaded automatically
4. A success message will appear when upload completes

### Viewing Files

- Files are displayed in a grid layout
- Images show a preview thumbnail
- Other file types show a generic file icon
- Click "View" to open the file in a new tab

### Deleting Files

1. Click the trash icon on any file card
2. Confirm the deletion in the dialog
3. The file will be removed from storage

### File Information

Each file card displays:
- Original filename
- File size (formatted in KB/MB/GB)
- Upload date
- File type (via icon)

## API Endpoints

### GET /api/media

List all media files.

**Query Parameters:**
- `folder` (optional) - Filter by folder
- `action=provider-info` - Get storage provider information

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890-abc123.jpg",
      "name": "1234567890-abc123.jpg",
      "originalName": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "url": "http://localhost:5173/uploads/1234567890-abc123.jpg",
      "provider": "local",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/media

Upload a new file.

**Headers:**
- `Authorization: Bearer <token>` - Required
- `Content-Type: multipart/form-data` - Required

**Body:**
- `file` - The file to upload (form-data)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1234567890-abc123.jpg",
    "name": "1234567890-abc123.jpg",
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "http://localhost:5173/uploads/1234567890-abc123.jpg",
    "provider": "local",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /api/media

Delete a file.

**Query Parameters:**
- `id` (required) - File ID to delete

**Headers:**
- `Authorization: Bearer <token>` - Required

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Architecture

### Storage Provider Interface

All storage providers implement the `StorageProvider` interface:

```typescript
interface StorageProvider {
  name: string
  upload(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile>
  delete(fileId: string): Promise<boolean>
  getUrl(fileId: string): Promise<string>
  list(folder?: string): Promise<MediaFile[]>
  exists(fileId: string): Promise<boolean>
  getMetadata(fileId: string): Promise<MediaFile | null>
}
```

### Adding a New Provider

To add a new storage provider:

1. Create a new provider class in `src/storage/providers/`
2. Implement the `StorageProvider` interface
3. Export the provider from `src/storage/index.ts`
4. Add the provider to the factory in `getStorageProvider()`
5. Update documentation with configuration details

Example:

```typescript
// src/storage/providers/custom.ts
import { MediaFile, StorageProvider, UploadOptions } from '../types.js'

export class CustomStorageProvider implements StorageProvider {
  name = 'custom'

  async upload(file: Buffer, filename: string, options?: UploadOptions): Promise<MediaFile> {
    // Implementation
  }

  async delete(fileId: string): Promise<boolean> {
    // Implementation
  }

  // ... implement other methods
}
```

```typescript
// src/storage/index.ts
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local'

  switch (provider.toLowerCase()) {
    case 'custom':
      return new CustomStorageProvider()
    // ... other cases
  }
}
```

## Best Practices

### Security

1. **Always require authentication** - The media API endpoints check for valid JWT tokens
2. **Validate file types** - Add file type restrictions if needed
3. **Limit file sizes** - Configure multer with size limits
4. **Use signed URLs** - S3 and GCS providers use signed URLs for temporary access

### Performance

1. **Use CDN** - Configure CloudFront (S3) or Cloud CDN (GCS) for better performance
2. **Optimize images** - Consider image optimization before upload
3. **Cache responses** - Configure appropriate cache headers
4. **Lazy loading** - The UI loads files on demand

### Storage Management

1. **Monitor storage usage** - Track storage costs and usage
2. **Implement cleanup** - Add policies to remove old unused files
3. **Backup important files** - Ensure data redundancy
4. **Use lifecycle policies** - Configure automatic archival (S3/GCS)

## Troubleshooting

### Files not uploading

- Check authentication token is valid
- Verify storage provider configuration
- Check file permissions (local storage)
- Review console logs for errors

### Files not displaying

- Verify CORS configuration for S3/GCS
- Check file URLs are accessible
- Ensure bucket permissions are correct
- Verify BASE_URL is correct (local storage)

### Storage errors

- **S3**: Check IAM permissions and bucket policies
- **GCS**: Verify service account has correct roles
- **Local**: Check directory exists and is writable

## Migration Between Providers

To migrate from one provider to another:

1. Update environment variables to new provider
2. Upload existing files to new storage
3. Update file URLs in database (if tracking externally)
4. Test thoroughly before going live
5. Clean up old storage after migration

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - Overall application architecture
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Content Manager](./CONTENT_MANAGER.md) - Content management system
- [README](./README.md) - Getting started guide
