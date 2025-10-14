# Content Manager

The Content Manager provides a dynamic CRUD API for managing content entries based on dynamically defined content types. It works seamlessly with the Content Type Builder to provide a complete headless CMS experience.

## Overview

While the Content Type Builder defines the **structure** of your content (schema/models), the Content Manager handles **CRUD operations** on the actual content entries (data). This separation follows the Strapi CMS architecture pattern.

## Features

- ✅ **Dynamic CRUD Operations**: Create, read, update, and delete entries for any content type
- ✅ **Type Validation**: Automatic validation based on content type definitions
- ✅ **Query Options**: Support for filtering, sorting, pagination, and relations
- ✅ **Authentication**: All endpoints require JWT authentication
- ✅ **Error Handling**: Comprehensive error messages for debugging
- ✅ **Type Safety**: Full TypeScript support

## Architecture

```
Content Type Builder (Schema)  →  Content Manager (Data)
        ↓                                    ↓
   definitions.json                  Prisma Database
        ↓                                    ↓
   schema.prisma            ←         CRUD Operations
```

## API Endpoints

### Base URL
- **Development**: `http://localhost:5173/api/content`
- **Production (Vercel)**: `https://your-app.vercel.app/api/content`

### Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 1. Get All Entries
```http
GET /api/content?contentType={contentType}
```

**Query Parameters:**
- `contentType` (required): The content type UID (e.g., `api::article.article`)
- `where` (optional): JSON string for filtering
- `orderBy` (optional): JSON string for sorting
- `skip` (optional): Number of entries to skip (pagination)
- `take` (optional): Number of entries to return (pagination)
- `count` (optional): Set to `"true"` to include total count

**Example:**
```bash
curl -X GET "http://localhost:5173/api/content?contentType=api::article.article&take=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "My First Article",
      "slug": "my-first-article",
      "content": "...",
      "published": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42
  }
}
```

#### 2. Get Single Entry
```http
GET /api/content?contentType={contentType}&id={id}
```

**Query Parameters:**
- `contentType` (required): The content type UID
- `id` (required): The entry ID

**Example:**
```bash
curl -X GET "http://localhost:5173/api/content?contentType=api::article.article&id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My First Article",
    "slug": "my-first-article",
    "content": "..."
  }
}
```

#### 3. Create Entry
```http
POST /api/content?contentType={contentType}
```

**Query Parameters:**
- `contentType` (required): The content type UID

**Request Body:**
```json
{
  "title": "New Article",
  "slug": "new-article",
  "content": "Article content here",
  "published": false,
  "status": "draft",
  "authorId": 1,
  "categoryId": 2
}
```

**Example:**
```bash
curl -X POST "http://localhost:5173/api/content?contentType=api::article.article" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Article","slug":"new-article","content":"..."}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "New Article",
    "slug": "new-article",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4. Update Entry
```http
PUT /api/content?contentType={contentType}&id={id}
```

**Query Parameters:**
- `contentType` (required): The content type UID
- `id` (required): The entry ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "published": true
}
```

**Example:**
```bash
curl -X PUT "http://localhost:5173/api/content?contentType=api::article.article&id=42" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","published":true}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "Updated Title",
    "published": true,
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

#### 5. Delete Entry
```http
DELETE /api/content?contentType={contentType}&id={id}
```

**Query Parameters:**
- `contentType` (required): The content type UID
- `id` (required): The entry ID

**Example:**
```bash
curl -X DELETE "http://localhost:5173/api/content?contentType=api::article.article&id=42" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

## Service API (TypeScript)

For server-side usage, you can import the service directly:

```typescript
import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count
} from './src/services/contentManagerService.js'

// Find all articles
const articles = await findMany('api::article.article', {
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
})

// Find a specific article
const article = await findOne('api::article.article', 1)

// Create a new article
const newArticle = await create('api::article.article', {
  data: {
    title: 'New Article',
    slug: 'new-article',
    content: 'Article content',
    published: false,
    authorId: 1,
  },
})

// Update an article
const updatedArticle = await update('api::article.article', {
  where: { id: 1 },
  data: { published: true },
})

// Delete an article
await deleteOne('api::article.article', {
  where: { id: 1 },
})

// Count articles
const total = await count('api::article.article', {
  published: true,
})
```

## Validation

The Content Manager automatically validates data against the content type definition:

### Required Fields
```typescript
// This will throw an error if 'title' is required
await create('api::article.article', {
  data: {
    slug: 'test', // Missing required 'title'
  },
})
// Error: Required field 'title' is missing
```

### Type Validation
```typescript
// This will throw an error
await create('api::article.article', {
  data: {
    title: 123, // Should be string
    published: 'yes', // Should be boolean
  },
})
// Error: Field 'title' must be a string
```

### Field Constraints
```typescript
// This will throw an error if maxLength is 255
await create('api::article.article', {
  data: {
    title: 'A'.repeat(300), // Too long
  },
})
// Error: Field 'title' exceeds maximum length of 255
```

### Enum Values
```typescript
// This will throw an error
await create('api::article.article', {
  data: {
    status: 'invalid', // Must be 'draft', 'published', or 'archived'
  },
})
// Error: Field 'status' must be one of: draft, published, archived
```

## Error Handling

All methods throw descriptive errors:

```typescript
try {
  await findOne('api::article.article', 999)
} catch (error) {
  console.error(error.message)
  // Error: Failed to find api::article.article entry: Record to read not found
}
```

Common error scenarios:
- **Content type not found**: `Content type 'api::invalid.invalid' not found`
- **Validation error**: `Required field 'title' is missing`
- **Prisma error**: `Failed to create api::article.article entry: ...`

## Query Options

### FindOptions
```typescript
interface FindOptions {
  where?: Record<string, any>      // Filter conditions
  select?: Record<string, boolean> // Field selection
  include?: Record<string, any>    // Relations to include
  orderBy?: Record<string, 'asc' | 'desc'> // Sorting
  skip?: number                    // Pagination offset
  take?: number                    // Pagination limit
}
```

**Examples:**

```typescript
// Filter by published status
await findMany('api::article.article', {
  where: { published: true },
})

// Include relations
await findMany('api::article.article', {
  include: {
    author: true,
    category: true,
  },
})

// Sort by creation date
await findMany('api::article.article', {
  orderBy: { createdAt: 'desc' },
})

// Pagination
await findMany('api::article.article', {
  skip: 20,
  take: 10, // Get items 21-30
})

// Select specific fields
await findMany('api::article.article', {
  select: {
    id: true,
    title: true,
    slug: true,
  },
})
```

## Integration with Content Type Builder

The Content Manager automatically works with any content type defined in the Content Type Builder:

1. **Define a content type** in `content-types/definitions.json`
2. **Generate Prisma schema** (automatic in dev mode)
3. **Run migrations** (`npm run prisma:migrate`)
4. **Use Content Manager** to create/read/update/delete entries

Example workflow:

```bash
# 1. Define content type
echo '{
  "api::product.product": {
    "uid": "api::product.product",
    "displayName": "Product",
    "singularName": "product",
    "pluralName": "products",
    "fields": {
      "name": { "type": "string", "required": true },
      "price": { "type": "decimal", "required": true },
      "inStock": { "type": "boolean", "default": true }
    }
  }
}' > content-types/definitions.json

# 2. Generate schema (automatic in dev mode)
npm run content-type:generate

# 3. Run migrations
npm run prisma:migrate

# 4. Create a product via API
curl -X POST "http://localhost:5173/api/content?contentType=api::product.product" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":19.99,"inStock":true}'
```

## Best Practices

1. **Always validate content types exist** before performing operations
2. **Use TypeScript interfaces** for type safety when working with content
3. **Handle errors gracefully** with try-catch blocks
4. **Use pagination** for large datasets
5. **Include relations selectively** to avoid over-fetching
6. **Validate input data** on the client side before sending to API
7. **Use filters** instead of fetching all and filtering client-side

## Comparison with Content Type Service

| Feature | Content Type Service | Content Manager Service |
|---------|---------------------|------------------------|
| Purpose | Manage content **type definitions** | Manage content **entries** |
| Operations | CRUD on schemas | CRUD on data |
| Example | Create "Article" content type | Create an article entry |
| File | `contentTypeService.ts` | `contentManagerService.ts` |
| API | `/api/content-types` | `/api/content` |

## Future Enhancements

Potential features for future versions:

- [ ] Bulk operations (create/update/delete multiple entries)
- [ ] Advanced filtering (full-text search, complex queries)
- [ ] File upload support for media fields
- [ ] Versioning and draft/publish workflow
- [ ] Webhooks for content changes
- [ ] Content localization (i18n)
- [ ] Soft delete support
- [ ] Activity logging and audit trail
- [ ] GraphQL API support
- [ ] Real-time subscriptions

## Troubleshooting

### Issue: "Content type not found"
**Solution:** Make sure the content type is defined in `content-types/definitions.json` and the UID matches exactly.

### Issue: "Prisma model not found"
**Solution:** Run `npm run content-type:generate` to regenerate the Prisma schema, then `npm run prisma:migrate`.

### Issue: "Required field is missing"
**Solution:** Check the content type definition and ensure all required fields are provided in the request body.

### Issue: "Authentication required"
**Solution:** Include a valid JWT token in the Authorization header: `Authorization: Bearer <token>`

## Related Documentation

- [Content Type Builder](./CONTENT_TYPE_BUILDER.md)
- [API Reference](./API.md)
- [Authentication](./AUTHENTICATION.md)
