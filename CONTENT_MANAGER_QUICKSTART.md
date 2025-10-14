# Content Manager Quick Reference

Quick reference guide for using the Content Manager API.

## API Endpoints

### Base URL
- Development: `http://localhost:5173/api/content`
- Production: `https://your-app.vercel.app/api/content`

### Authentication
All requests require JWT token:
```
Authorization: Bearer <token>
```

## Basic Operations

### Get All Entries
```bash
GET /api/content?contentType=api::article.article
```

### Get Single Entry
```bash
GET /api/content?contentType=api::article.article&id=1
```

### Create Entry
```bash
POST /api/content?contentType=api::article.article
Content-Type: application/json

{
  "title": "New Article",
  "slug": "new-article",
  "content": "Article content...",
  "published": false,
  "authorId": 1
}
```

### Update Entry
```bash
PUT /api/content?contentType=api::article.article&id=1
Content-Type: application/json

{
  "title": "Updated Title",
  "published": true
}
```

### Delete Entry
```bash
DELETE /api/content?contentType=api::article.article&id=1
```

## Query Parameters

### Filtering
```bash
GET /api/content?contentType=api::article.article&where={"published":true}
```

### Sorting
```bash
GET /api/content?contentType=api::article.article&orderBy={"createdAt":"desc"}
```

### Pagination
```bash
GET /api/content?contentType=api::article.article&skip=0&take=10
```

### Count
```bash
GET /api/content?contentType=api::article.article&count=true
```

## TypeScript Service API

```typescript
import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count
} from './src/services/contentManagerService.js'

// Find all
const articles = await findMany('api::article.article', {
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
})

// Find one
const article = await findOne('api::article.article', 1)

// Create
const newArticle = await create('api::article.article', {
  data: {
    title: 'New Article',
    slug: 'new-article',
    content: 'Content...',
    authorId: 1,
  },
})

// Update
const updated = await update('api::article.article', {
  where: { id: 1 },
  data: { published: true },
})

// Delete
await deleteOne('api::article.article', {
  where: { id: 1 },
})

// Count
const total = await count('api::article.article')
```

## Common Patterns

### Get with Relations
```typescript
const articles = await findMany('api::article.article', {
  include: {
    author: true,
    category: true,
  },
})
```

### Paginated List
```typescript
const page = 1
const pageSize = 10

const articles = await findMany('api::article.article', {
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
})

const total = await count('api::article.article')
const totalPages = Math.ceil(total / pageSize)
```

### Search and Filter
```typescript
const results = await findMany('api::article.article', {
  where: {
    published: true,
    status: 'published',
  },
  orderBy: { publishedAt: 'desc' },
  take: 20,
})
```

### Select Specific Fields
```typescript
const articles = await findMany('api::article.article', {
  select: {
    id: true,
    title: true,
    slug: true,
    publishedAt: true,
  },
})
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Entry not found"
}
```

### 400 Validation Error
```json
{
  "success": false,
  "error": "Required field 'title' is missing"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Failed to create api::article.article entry: ..."
}
```

## Content Types

The Content Manager works with any content type defined in `content-types/definitions.json`. Example content types:

- `api::article.article` - Blog articles
- `api::category.category` - Article categories  
- `api::user.user` - Users/Authors

## Related Documentation

- Full Documentation: [CONTENT_MANAGER.md](./CONTENT_MANAGER.md)
- Content Type Builder: [CONTENT_TYPE_BUILDER.md](./CONTENT_TYPE_BUILDER.md)
- Examples: [scripts/content-manager-example.ts](./scripts/content-manager-example.ts)
