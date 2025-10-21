# Vercel Blob Storage Integration

This project includes a Vercel Blob storage provider using the official `@vercel/blob` SDK for both server-side and client-side operations.

## Environment Variables

- `STORAGE_PROVIDER=vercel` or `vercel-blob`
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token with read/write access (get from Vercel dashboard)

## Installation

The required package is already installed:
```bash
npm install @vercel/blob
```

## Server-Side Usage

The `VercelBlobStorageProvider` automatically handles uploads when `STORAGE_PROVIDER` is set to `vercel` or `vercel-blob`:

```typescript
import { mediaService } from '@/services/mediaService'

// Upload a file
const file = Buffer.from(...)
const result = await mediaService.uploadFile(file, 'myfile.jpg', {
  contentType: 'image/jpeg',
  folder: 'uploads'
})

// List files
const files = await mediaService.listFiles()

// Delete a file
await mediaService.deleteFile(fileId)
```

## Client-Side Usage

Use the helper in `src/lib/blob.ts` for direct browser uploads:

```typescript
import { uploadToVercelBlob } from '@/lib/blob'

// Upload from a file input
const file = document.querySelector('input[type="file"]').files[0]
const blob = await uploadToVercelBlob(file.name, file)

console.log('Uploaded:', blob.url)
```

## How it works

### Server-Side Operations
1. Uses `@vercel/blob` SDK functions: `put()`, `del()`, `list()`, `head()`
2. All operations use `BLOB_READ_WRITE_TOKEN` from environment
3. Files are stored in Vercel Blob storage with public access

### Client-Side Uploads
1. Client calls `uploadToVercelBlob(filename, file)`
2. SDK makes request to `/api/media?filename=...` to get upload token
3. API returns token for client-side upload
4. `@vercel/blob/client` handles the actual upload directly to Vercel
5. Returns blob metadata including public URL

## API Endpoints

### POST `/api/media?filename=example.jpg`
Returns upload token for client-side uploads when using Vercel Blob provider.

Response:
```json
{
  "url": "https://blob.vercel-storage.com/example.jpg",
  "token": "vercel_blob_rw_..."
}
```

### GET `/api/media`
Lists all files in Vercel Blob storage.

### DELETE `/api/media?id=path/to/file.jpg`
Deletes a file from Vercel Blob storage.

## Notes

- Direct client-side uploads avoid serverless function size limits
- All uploads are public by default
- Files are identified by their pathname (can include folders)
- The official SDK handles authentication, retries, and error handling
